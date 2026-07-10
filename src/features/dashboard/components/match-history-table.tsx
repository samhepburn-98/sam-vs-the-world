import { cn } from "@/lib/utils"

import type { HistoryMatch } from "@/features/dashboard/lib/profile-fixture"

// Match history as a table: date, opponent, result, every game as a score
// pill (won games read brighter), and the one thing worth remembering about
// the night. Denser than a timeline and scannable column-by-column — "how
// did the Woody matches go" is one glance down the opponent column.

function ScorePill({ score }: { score: string }) {
  const [mine, theirs] = score.split("-").map(Number)
  const won = mine > theirs
  return (
    <span
      className={cn(
        "inline-block rounded-md border px-1.5 py-0.5 text-xs tabular-nums",
        won
          ? "border-foreground/25 text-foreground"
          : "text-muted-foreground/80"
      )}
    >
      {score}
    </span>
  )
}

export function MatchHistoryTable({
  matches,
}: {
  matches: Array<HistoryMatch>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            <th className="py-2 pr-3 font-medium">Date</th>
            <th className="py-2 pr-3 font-medium">Opponent</th>
            <th className="py-2 pr-3 font-medium">
              <span className="sr-only">Won or lost</span>
            </th>
            <th className="py-2 pr-3 font-medium">Result</th>
            <th className="py-2 pr-3 font-medium">Games</th>
            <th className="py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr
              key={`${m.date}-${m.opponent}`}
              className="border-b last:border-b-0"
            >
              <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground tabular-nums">
                {m.date}
              </td>
              <td className="py-2.5 pr-3 font-medium">{m.opponent}</td>
              <td className="py-2.5 pr-3">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-md text-xs font-bold",
                    m.won
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-red-500/15 text-red-500"
                  )}
                >
                  {m.won ? "W" : "L"}
                </span>
              </td>
              <td className="py-2.5 pr-3 tabular-nums">{m.result}</td>
              <td className="py-2.5 pr-3">
                <div className="flex flex-wrap gap-1">
                  {m.games.map((score, i) => (
                    <ScorePill key={i} score={score} />
                  ))}
                </div>
              </td>
              <td className="py-2.5 text-xs text-muted-foreground">{m.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
