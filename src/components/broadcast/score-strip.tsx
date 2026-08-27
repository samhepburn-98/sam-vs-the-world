import { cn } from "@/lib/utils"

// The score strip: the full-time graphic. A deep panel — one surface step
// below the studio floor — with the two names in the display face and the
// score between them. The score carries the side colours when a winner is
// known; a neutral strip (draw, in play) stays white.

export function ScoreStrip({
  name1,
  name2,
  score1,
  score2,
  outcome = null,
  className,
}: {
  name1: string
  name2: string
  score1: number
  score2: number
  /** Which side the result went to — colors that side's score. */
  outcome?: "p1" | "p2" | null
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 bg-panel-deep px-4 py-3",
        className
      )}
    >
      <span className="min-w-0 truncate font-heading text-lg font-bold uppercase">
        {name1}
      </span>
      <span className="shrink-0 font-heading text-2xl font-extrabold tabular-nums">
        <span className={cn(outcome === "p1" && "text-primary-strong")}>
          {score1}
        </span>
        <span className="mx-2 text-muted-foreground/60">–</span>
        <span className={cn(outcome === "p2" && "text-p2-strong")}>
          {score2}
        </span>
      </span>
      <span className="min-w-0 truncate text-right font-heading text-lg font-bold uppercase">
        {name2}
      </span>
    </div>
  )
}
