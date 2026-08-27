import { ResultChip } from "@/components/broadcast/result-chip"
import { cn } from "@/lib/utils"

// The form guide: a player's recent results as a row of result chips,
// newest last — the football-style W/D/L strip. This is the "ongoing"
// story of a player: no seasons, just the run of play.

export function FormGuide({
  results,
  className,
}: {
  /** Oldest first; render at most the last five. */
  results: Array<"w" | "l" | "d">
  className?: string
}) {
  const recent = results.slice(-5)
  if (recent.length === 0) return null
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Last ${recent.length} results, oldest first`}
    >
      {recent.map((r, i) => (
        <ResultChip key={i} result={r} />
      ))}
    </span>
  )
}
