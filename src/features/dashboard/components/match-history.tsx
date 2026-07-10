import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"

import type { HistoryMatch } from "@/features/dashboard/lib/profile-fixture"

// Match history in two renderings of the same rows: a table from sm up
// (date, opponent, result, score pills, the night's one remembered moment),
// and a stacked Item list below it, where the table's horizontal scroll
// would bury the note column. A CSS breakpoint does the switching — both
// layouts are always rendered, so there's no matchMedia hook to drift from
// SSR or fall over in jsdom.

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

function ResultBadge({ won }: { won: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md text-xs font-bold",
        won
          ? "bg-emerald-500/15 text-emerald-500"
          : "bg-red-500/15 text-red-500"
      )}
    >
      {won ? "W" : "L"}
    </span>
  )
}

function HistoryTable({ matches }: { matches: Array<HistoryMatch> }) {
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
                <ResultBadge won={m.won} />
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

function HistoryItems({ matches }: { matches: Array<HistoryMatch> }) {
  return (
    <ItemGroup className="gap-2">
      {matches.map((m) => (
        <Item key={`${m.date}-${m.opponent}`} variant="muted" size="sm">
          <ItemMedia>
            <ResultBadge won={m.won} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {m.opponent}
              <span className="font-normal text-muted-foreground tabular-nums">
                · {m.result}
              </span>
            </ItemTitle>
            <div className="flex flex-wrap gap-1">
              {m.games.map((score, i) => (
                <ScorePill key={i} score={score} />
              ))}
            </div>
            <ItemDescription className="text-xs">{m.note}</ItemDescription>
          </ItemContent>
          <ItemActions className="self-start text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            {m.date}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}

export function MatchHistory({ matches }: { matches: Array<HistoryMatch> }) {
  return (
    <>
      <div className="max-sm:hidden">
        <HistoryTable matches={matches} />
      </div>
      <div className="sm:hidden">
        <HistoryItems matches={matches} />
      </div>
    </>
  )
}
