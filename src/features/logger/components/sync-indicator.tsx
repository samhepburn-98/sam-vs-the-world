import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

import type { QueueState, WriteQueue } from "@/lib/api/write-queue"

// Quiet sync status (§5.3): synced ✓ / syncing… / paused. A pause is loud —
// the queue never logs past a hole, so the user must resolve it.

export function SyncIndicator({ queue }: { queue: WriteQueue }) {
  const [state, setState] = useState<QueueState>(() => queue.state)

  useEffect(() => {
    setState(queue.state)
    return queue.subscribe(setState)
  }, [queue])

  if (state.status === "paused") {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-2.5 text-sm"
      >
        <span className="flex-1 text-destructive">
          A save failed ({state.failure?.op.label ?? "unknown"}) — logging is
          paused so nothing lands out of order.
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => queue.resume()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <p className="text-right text-xs text-muted-foreground" aria-live="polite">
      {state.pending > 0 ? `Syncing ${state.pending}…` : "Synced ✓"}
    </p>
  )
}
