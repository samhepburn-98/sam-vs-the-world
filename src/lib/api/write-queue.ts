// The logger's strict FIFO write queue (§5.3, §8.3, §8.7 #3).
//
// Every logger write — rally saves, undo deletes, inline edits, game creation
// — flows through here, one at a time, in order. Op n+1 is never sent until
// op n is confirmed, so an out-of-order failure can't leave a silent hole
// that shifts every derived score. Client-generated UUIDs make retries
// idempotent: a timeout-then-retry that actually landed surfaces as a
// unique violation, which the classifier maps to "already applied" = success.
// A permanent failure hard-pauses the queue — never log past a hole. So does
// a transient one that never clears: retries are capped, because "retry for
// ever" is indistinguishable from a hang to anyone awaiting flush().

export type QueueStatus = "idle" | "syncing" | "paused"

export type ErrorClass = "retryable" | "already_applied" | "permanent"

export interface WriteOp {
  /** client-generated id of the row this op writes (idempotency anchor) */
  id: string
  /** for the sync indicator / error surface, e.g. "save rally 12" */
  label: string
  run: () => Promise<unknown>
}

export interface QueueState {
  status: QueueStatus
  /** ops not yet confirmed (includes the one in flight) */
  pending: number
  /** set while paused */
  failure?: { op: WriteOp; error: unknown }
}

interface WriteQueueOptions {
  classify: (error: unknown) => ErrorClass
  /** injectable for tests */
  sleep?: (ms: number) => Promise<void>
  /** capped exponential backoff by default */
  backoffMs?: (attempt: number) => number
  /** total run() attempts per op (initial + retries) before a retryable
   *  failure pauses the queue; defaults to DEFAULT_MAX_ATTEMPTS */
  maxAttempts?: number
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const defaultBackoff = (attempt: number) =>
  Math.min(1000 * 2 ** (attempt - 1), 8000)

// ~23s of backoff before a sustained transient failure pauses: long enough
// that a courtside connectivity blip heals itself, short enough that a real
// outage reaches the user while they're still looking at the screen.
const DEFAULT_MAX_ATTEMPTS = 6

export class WriteQueue {
  private queue: Array<WriteOp> = []
  private status: QueueStatus = "idle"
  private failure: QueueState["failure"]
  private processing = false
  private listeners = new Set<(state: QueueState) => void>()
  private drainResolvers: Array<() => void> = []

  private readonly classify: WriteQueueOptions["classify"]
  private readonly sleep: (ms: number) => Promise<void>
  private readonly backoffMs: (attempt: number) => number
  private readonly maxAttempts: number

  constructor(options: WriteQueueOptions) {
    this.classify = options.classify
    this.sleep = options.sleep ?? defaultSleep
    this.backoffMs = options.backoffMs ?? defaultBackoff
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  }

  get state(): QueueState {
    return {
      status: this.status,
      pending: this.queue.length,
      failure: this.failure,
    }
  }

  subscribe(listener: (state: QueueState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  enqueue(op: WriteOp): void {
    this.queue.push(op)
    this.emit()
    void this.process()
  }

  /** retry the failed head op (e.g. after the user fixes connectivity) */
  resume(): void {
    if (this.status !== "paused") return
    this.failure = undefined
    this.setStatus(this.queue.length > 0 ? "syncing" : "idle")
    void this.process()
  }

  /** drop the failed head op (e.g. the user chose to abandon that write) */
  discardFailed(): void {
    if (this.status !== "paused") return
    this.queue.shift()
    this.failure = undefined
    this.setStatus(this.queue.length > 0 ? "syncing" : "idle")
    void this.process()
  }

  /** resolves when every queued op is confirmed (or the queue pauses) —
   *  always settles, since retries are bounded */
  flush(): Promise<void> {
    if (this.queue.length === 0 || this.status === "paused") {
      return Promise.resolve()
    }
    return new Promise((resolve) => this.drainResolvers.push(resolve))
  }

  private async process(): Promise<void> {
    if (this.processing || this.status === "paused") return
    this.processing = true
    if (this.queue.length > 0) this.setStatus("syncing")

    while (this.queue.length > 0) {
      const op = this.queue[0]
      let attempt = 0
      let settled = false
      while (!settled) {
        try {
          await op.run()
          settled = true
        } catch (error) {
          const kind = this.classify(error)
          if (kind === "already_applied") {
            settled = true
          } else if (kind === "retryable") {
            attempt += 1
            if (attempt >= this.maxAttempts) {
              // out of retries: pause rather than spin, so flush() waiters
              // settle and the user gets the Retry affordance
              this.pause(op, error)
              return
            }
            await this.sleep(this.backoffMs(attempt))
          } else {
            this.pause(op, error)
            return
          }
        }
      }
      this.queue.shift()
      this.emit()
    }

    this.processing = false
    this.setStatus("idle")
    this.releaseDrain()
  }

  /** stop on the failed head op — it stays queued, nothing behind it runs */
  private pause(op: WriteOp, error: unknown): void {
    this.failure = { op, error }
    this.processing = false
    this.setStatus("paused")
    this.releaseDrain()
  }

  private releaseDrain(): void {
    const resolvers = this.drainResolvers
    this.drainResolvers = []
    for (const resolve of resolvers) resolve()
  }

  private setStatus(status: QueueStatus): void {
    if (this.status === status) return
    this.status = status
    this.emit()
  }

  private emit(): void {
    const snapshot = this.state
    for (const listener of this.listeners) listener(snapshot)
  }
}
