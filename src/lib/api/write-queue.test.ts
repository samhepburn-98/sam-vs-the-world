import { describe, expect, it } from "vitest"

import { classifySupabaseWriteError } from "./supabase-errors"
import { WriteQueue } from "./write-queue"

import type { ErrorClass, QueueState, WriteOp } from "./write-queue"

// §8.7 #3 — the failure modes that would silently corrupt data, simulated
// with a mocked "supabase" (plain async fns) and instant backoff.

function makeQueue(classify?: (e: unknown) => ErrorClass) {
  return new WriteQueue({
    classify: classify ?? classifySupabaseWriteError,
    sleep: () => Promise.resolve(),
    backoffMs: () => 0,
  })
}

function deferred() {
  let resolve!: () => void
  let reject!: (e: unknown) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// a macrotask sleep — still instant, but it yields, so a regression back to
// unbounded retrying fails on the vitest timeout instead of starving the
// event loop with a pure-microtask spin that no timer can interrupt
const yieldSleep = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function cappedQueue(maxAttempts?: number) {
  return new WriteQueue({
    classify: classifySupabaseWriteError,
    sleep: yieldSleep,
    backoffMs: () => 0,
    maxAttempts,
  })
}

const op = (id: string, run: WriteOp["run"]): WriteOp => ({
  id,
  label: id,
  run,
})

describe("strict FIFO ordering", () => {
  it("never runs two ops concurrently and preserves order", async () => {
    const queue = makeQueue()
    const started: Array<string> = []
    const finished: Array<string> = []
    let active = 0
    let maxActive = 0

    const slow = deferred()
    queue.enqueue(
      op("op-1", async () => {
        started.push("op-1")
        active++
        maxActive = Math.max(maxActive, active)
        await slow.promise
        active--
        finished.push("op-1")
      })
    )
    // enqueued while op-1 is in flight — a fast op that must still wait
    queue.enqueue(
      op("op-2", async () => {
        started.push("op-2")
        active++
        maxActive = Math.max(maxActive, active)
        active--
        finished.push("op-2")
      })
    )

    await Promise.resolve()
    expect(started).toEqual(["op-1"]) // op-2 not started while op-1 in flight
    slow.resolve()
    await queue.flush()
    expect(finished).toEqual(["op-1", "op-2"])
    expect(maxActive).toBe(1)
  })

  it("an undo delete enqueued behind its own in-flight insert waits for it", async () => {
    const queue = makeQueue()
    const events: Array<string> = []
    const insert = deferred()

    queue.enqueue(
      op("insert-rally-7", async () => {
        events.push("insert:start")
        await insert.promise
        events.push("insert:done")
      })
    )
    queue.enqueue(
      op("delete-rally-7", async () => {
        events.push("delete:start")
      })
    )

    await Promise.resolve()
    expect(events).toEqual(["insert:start"])
    insert.resolve()
    await queue.flush()
    expect(events).toEqual(["insert:start", "insert:done", "delete:start"])
  })
})

describe("retry semantics", () => {
  it("retries transient failures with backoff until success", async () => {
    const queue = makeQueue()
    let attempts = 0
    queue.enqueue(
      op("flaky", () => {
        attempts++
        if (attempts < 3) {
          return Promise.reject(new TypeError("fetch failed"))
        }
        return Promise.resolve()
      })
    )
    await queue.flush()
    expect(attempts).toBe(3)
    expect(queue.state).toMatchObject({ status: "idle", pending: 0 })
  })

  it("gives up on a sustained transient failure: pauses, so flush() settles", async () => {
    const queue = cappedQueue(4)
    let attempts = 0
    let laterRan = false
    queue.enqueue(
      op("always-503", () => {
        attempts++
        return Promise.reject({ status: 503 })
      })
    )
    queue.enqueue(
      op("later", () => {
        laterRan = true
        return Promise.resolve()
      })
    )

    // the defect this guards: under a never-clearing 503 this await never
    // settled, so entry.tsx's new-match form hung with no way out
    await queue.flush()

    expect(attempts).toBe(4)
    expect(queue.state.status).toBe("paused")
    expect(queue.state.failure?.op.id).toBe("always-503")
    expect(queue.state.pending).toBe(2) // failed op retained at head
    expect(laterRan).toBe(false) // still never logs past a hole
  })

  it("the default attempt cap is finite", async () => {
    const queue = cappedQueue() // no maxAttempts — the shipped default
    let attempts = 0
    queue.enqueue(
      op("always-offline", () => {
        attempts++
        return Promise.reject(new TypeError("fetch failed"))
      })
    )

    await queue.flush()

    expect(queue.state.status).toBe("paused")
    expect(attempts).toBeGreaterThan(1) // a blip still gets retried
    expect(attempts).toBeLessThan(50) // but not for ever
  })

  it("resume() after an exhausted retry picks the op back up", async () => {
    const queue = cappedQueue(3)
    let offline = true
    let landed = false
    queue.enqueue(
      op("save-rally-12", () => {
        if (offline) return Promise.reject({ status: 503 })
        landed = true
        return Promise.resolve()
      })
    )
    await queue.flush()
    expect(queue.state.status).toBe("paused")

    offline = false // connectivity back; the user taps Retry
    queue.resume()
    await queue.flush()

    expect(landed).toBe(true)
    expect(queue.state).toMatchObject({ status: "idle", pending: 0 })
  })

  it("timeout-then-retry after the write actually landed: unique violation = success", async () => {
    const queue = makeQueue()
    let attempts = 0
    const order: Array<string> = []
    queue.enqueue(
      op("landed-but-timed-out", () => {
        attempts++
        if (attempts === 1) {
          return Promise.reject(new TypeError("network timeout"))
        }
        // the retry hits the row the first attempt actually inserted
        return Promise.reject({ code: "23505", message: "duplicate key" })
      })
    )
    queue.enqueue(
      op("next", () => {
        order.push("next ran")
        return Promise.resolve()
      })
    )
    await queue.flush()
    expect(attempts).toBe(2)
    expect(order).toEqual(["next ran"]) // queue moved on, no pause
    expect(queue.state.status).toBe("idle")
  })

  it("permanent failure hard-pauses: nothing after the hole ever runs", async () => {
    const queue = makeQueue()
    let laterRan = false
    queue.enqueue(
      op("bad-row", () =>
        Promise.reject({
          code: "23514",
          status: 400,
          message: "check violation",
        })
      )
    )
    queue.enqueue(
      op("later", () => {
        laterRan = true
        return Promise.resolve()
      })
    )
    await queue.flush()
    expect(queue.state.status).toBe("paused")
    expect(queue.state.pending).toBe(2) // failed op retained at head
    expect(queue.state.failure?.op.id).toBe("bad-row")
    expect(laterRan).toBe(false)
  })
})

describe("pause recovery", () => {
  function pausedQueue() {
    const queue = makeQueue()
    let fail = true
    const ran: Array<string> = []
    queue.enqueue(
      op("head", () => {
        if (fail) {
          return Promise.reject({ status: 400 })
        }
        ran.push("head")
        return Promise.resolve()
      })
    )
    queue.enqueue(
      op("tail", () => {
        ran.push("tail")
        return Promise.resolve()
      })
    )
    return { queue, ran, fixHead: () => (fail = false) }
  }

  it("resume() retries the failed head then continues in order", async () => {
    const { queue, ran, fixHead } = pausedQueue()
    await queue.flush()
    expect(queue.state.status).toBe("paused")

    fixHead()
    queue.resume()
    await queue.flush()
    expect(ran).toEqual(["head", "tail"])
    expect(queue.state).toMatchObject({ status: "idle", pending: 0 })
  })

  it("stays paused until the user retries — nothing behind the hole runs", async () => {
    const { queue, ran } = pausedQueue()
    await queue.flush()

    // no discard path any more: a paused queue holds its place, and the
    // logger's Retry (resume) is the only way past it
    expect(queue.state.status).toBe("paused")
    expect(queue.state.failure?.op.id).toBe("head")
    expect(ran).toEqual([])
    expect(queue.state.pending).toBe(2)
  })
})

describe("observability", () => {
  it("emits idle → syncing → idle transitions with pending counts", async () => {
    const queue = makeQueue()
    const seen: Array<QueueState> = []
    queue.subscribe((s) => seen.push(s))

    queue.enqueue(op("one", () => Promise.resolve()))
    await queue.flush()

    const statuses = seen.map((s) => s.status)
    expect(statuses[0]).toBe("idle") // enqueue emit before processing
    expect(statuses).toContain("syncing")
    expect(statuses[statuses.length - 1]).toBe("idle")
    expect(seen[seen.length - 1].pending).toBe(0)
  })
})

describe("classifySupabaseWriteError", () => {
  it.each([
    [new TypeError("fetch failed"), "retryable"],
    [{ status: 503 }, "retryable"],
    [{ status: 429 }, "retryable"],
    [{ status: 408 }, "retryable"],
    [{ code: "23505", message: "duplicate key value" }, "already_applied"],
    [{ code: "23514", status: 400 }, "permanent"], // CHECK violation
    [{ code: "42501", status: 401 }, "permanent"], // RLS denial
    [{ status: 400 }, "permanent"],
    [null, "permanent"],
  ])("%o → %s", (error, expected) => {
    expect(classifySupabaseWriteError(error)).toBe(expected)
  })
})
