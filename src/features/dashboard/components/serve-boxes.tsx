import { cn } from "@/lib/utils"

import type { ServeBoxes as ServeBoxesData } from "@/features/dashboard/lib/profile-types"

// The serve split by box, plus the two serve punctuation marks (aces and
// double faults). The stronger box gets the accent — on a squash court
// "which side do I serve from at game ball" is a real decision this answers.

function Box({
  label,
  won,
  of,
  accent,
}: {
  label: string
  won: number
  of: number
  accent: boolean
}) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums",
          accent && "text-primary"
        )}
      >
        {of > 0 ? `${Math.round((won / of) * 100)}%` : "—"}
      </p>
      <p className="text-xs text-muted-foreground/70 tabular-nums">
        {of > 0 ? `${won} of ${of} serves won` : "no serves yet"}
      </p>
    </div>
  )
}

export function ServeBoxes({ serve }: { serve: ServeBoxesData }) {
  // rate is only comparable where the box has serves; an empty box never wins
  // the accent
  const leftRate = serve.left.of > 0 ? serve.left.won / serve.left.of : -1
  const rightRate = serve.right.of > 0 ? serve.right.won / serve.right.of : -1

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Box
          label="Left box"
          won={serve.left.won}
          of={serve.left.of}
          accent={leftRate >= rightRate}
        />
        <Box
          label="Right box"
          won={serve.right.won}
          of={serve.right.of}
          accent={rightRate > leftRate}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="border px-3 py-1 text-xs text-muted-foreground tabular-nums">
          {serve.aces} aces
        </span>
        <span className="border px-3 py-1 text-xs text-muted-foreground tabular-nums">
          {serve.doubleFaults} double faults
        </span>
      </div>
    </div>
  )
}
