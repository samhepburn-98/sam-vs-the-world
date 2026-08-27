import { cn } from "@/lib/utils"

// The score strip: the full-time graphic. A deep panel — one surface step
// below the studio floor — with the two names in the display face and the
// score between them. The score carries the side colours when a winner is
// known; a neutral strip (draw, in play) stays white.

export function ScoreStrip({
  p1Name,
  p2Name,
  p1Score,
  p2Score,
  outcome = null,
  className,
}: {
  p1Name: string
  p2Name: string
  p1Score: number
  p2Score: number
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
        {p1Name}
      </span>
      <span className="shrink-0 font-heading text-2xl font-extrabold tabular-nums">
        <span className={cn(outcome === "p1" && "text-primary-strong")}>
          {p1Score}
        </span>
        <span className="mx-2 text-muted-foreground/60">–</span>
        <span className={cn(outcome === "p2" && "text-p2-strong")}>
          {p2Score}
        </span>
      </span>
      <span className="min-w-0 truncate text-right font-heading text-lg font-bold uppercase">
        {p2Name}
      </span>
    </div>
  )
}
