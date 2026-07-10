import { cn } from "@/lib/utils"

// Every game of the season as one square, oldest to newest — streaks and
// slumps read as colour runs the way no aggregate can show them. The strip
// is one accessible image; per-square titles carry the detail for pointers.

export function SeasonStrip({ games }: { games: Array<boolean> }) {
  const won = games.filter(Boolean).length

  return (
    <div className="flex flex-col gap-3.5">
      <div
        role="img"
        aria-label={`${games.length} games oldest to newest: ${won} won, ${games.length - won} lost.`}
        className="flex flex-wrap gap-1.5"
      >
        {games.map((w, i) => (
          <span
            key={i}
            title={`Game ${i + 1} — ${w ? "won" : "lost"}`}
            className={cn(
              "size-4 rounded-[4px]",
              w ? "bg-emerald-500/80" : "bg-red-500/60"
            )}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-emerald-500/80" />
          Game won
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-red-500/60" />
          Game lost
        </span>
        <span className="ml-auto tabular-nums">
          {won} won · {games.length - won} lost
        </span>
      </div>
    </div>
  )
}
