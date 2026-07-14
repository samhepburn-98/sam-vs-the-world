import { Link } from "@tanstack/react-router"

import { BallDots } from "@/components/ball-dots"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"

import type { HistoryMatch } from "@/features/dashboard/lib/match-history"
import type { PlayerOutcome } from "@/lib/scoring/match"

// Match history in two renderings of the same rows: a table from sm up
// (date, opponent, result, score pills, the night's one remembered moment),
// and a stacked Item list below it, where the table's horizontal scroll
// would bury the note column. A CSS breakpoint does the switching — both
// layouts are always rendered, so there's no matchMedia hook to drift from
// SSR or fall over in jsdom.
//
// Every row opens its match. The table uses a stretched link (an anchor
// positioned over the whole row) so the click target is the row while the
// markup stays one accessible link per match; the mobile Item is rendered
// as that link directly. The mobile rows are flat — no per-row background
// or side padding — so the enclosing panel is the only card and each match
// reads as a hairline-ruled row of it, not a card floating inside another.

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

// pending: the match is still in play — a quiet dot, not a false verdict.
// The verdicts come oriented from the backend's outcome column; this maps
// them to glyphs, nothing more.
const BADGE: Record<PlayerOutcome, { glyph: string; className: string }> = {
  won: { glyph: "W", className: "bg-emerald-500/15 text-emerald-500" },
  lost: { glyph: "L", className: "bg-red-500/15 text-red-500" },
  drawn: { glyph: "D", className: "bg-muted text-foreground" },
  pending: { glyph: "·", className: "bg-muted text-muted-foreground" },
}

function ResultBadge({ outcome }: { outcome: PlayerOutcome }) {
  return (
    <span
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-md text-xs font-bold",
        BADGE[outcome].className
      )}
    >
      {BADGE[outcome].glyph}
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
              <span className="sr-only">Won, lost, or drawn</span>
            </th>
            <th className="py-2 pr-3 font-medium">Result</th>
            <th className="py-2 pr-3 font-medium">Ball</th>
            <th className="py-2 pr-3 font-medium">Games</th>
            <th className="py-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr
              key={m.id}
              className="relative border-b transition-colors last:border-b-0 hover:bg-muted/40"
            >
              <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground tabular-nums">
                {/* stretched link: covers the whole row (nearest positioned
                    ancestor is the tr) so a click anywhere opens the match */}
                <Link
                  to="/matches/$matchId"
                  params={{ matchId: m.id }}
                  aria-label={`Open the ${m.date} match against ${m.opponent}`}
                  className="absolute inset-0 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                />
                {m.date}
              </td>
              <td className="py-2.5 pr-3 font-medium">{m.opponent}</td>
              <td className="py-2.5 pr-3">
                <ResultBadge outcome={m.outcome} />
              </td>
              <td className="py-2.5 pr-3 tabular-nums">{m.result}</td>
              <td className="py-2.5 pr-3">
                {m.ball ? (
                  <BallDots ball={m.ball} />
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </td>
              <td className="py-2.5 pr-3">
                <div className="flex flex-wrap gap-1">
                  {m.games.map((score, i) => (
                    <ScorePill key={i} score={score} />
                  ))}
                </div>
              </td>
              <td className="py-2.5 text-xs text-muted-foreground">
                {m.note ?? <span className="text-muted-foreground/50">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HistoryItems({ matches }: { matches: Array<HistoryMatch> }) {
  return (
    <div role="list" className="divide-y divide-border/60">
      {matches.map((m) => (
        <Item
          key={m.id}
          asChild
          role="listitem"
          size="sm"
          className="rounded-none border-0 px-0 transition-colors hover:bg-muted/40"
        >
          <Link
            to="/matches/$matchId"
            params={{ matchId: m.id }}
            aria-label={`Open the ${m.date} match against ${m.opponent}`}
          >
            <ItemMedia>
              <ResultBadge outcome={m.outcome} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {m.opponent}
                <span className="font-normal text-muted-foreground tabular-nums">
                  · {m.result}
                </span>
                {m.ball && <BallDots ball={m.ball} />}
              </ItemTitle>
              <div className="flex flex-wrap gap-1">
                {m.games.map((score, i) => (
                  <ScorePill key={i} score={score} />
                ))}
              </div>
              {m.note && (
                <ItemDescription className="text-xs">{m.note}</ItemDescription>
              )}
            </ItemContent>
            <ItemActions className="self-start text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              {m.date}
            </ItemActions>
          </Link>
        </Item>
      ))}
    </div>
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
