import { cn } from "@/lib/utils"

import type { ServeBoxes as ServeBoxesData } from "@/features/dashboard/lib/profile-fixture"

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
        {Math.round((won / of) * 100)}%
      </p>
      <p className="text-xs text-muted-foreground/70 tabular-nums">
        {won} of {of} serves won
      </p>
    </div>
  )
}

export function ServeBoxes({ serve }: { serve: ServeBoxesData }) {
  const leftRate = serve.left.won / serve.left.of
  const rightRate = serve.right.won / serve.right.of

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
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground tabular-nums">
          {serve.aces} aces
        </span>
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground tabular-nums">
          {serve.doubleFaults} double faults
        </span>
      </div>
    </div>
  )
}
