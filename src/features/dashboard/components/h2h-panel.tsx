import { Link } from "@tanstack/react-router"
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"

import { useH2h } from "@/features/dashboard/api/get-h2h"
import { useH2hRallies } from "@/features/dashboard/api/get-h2h-rallies"
import { ProfileSection } from "@/features/dashboard/components/profile-section"
import { RallyTable } from "@/features/dashboard/components/rally-table"
import { StatCard } from "@/features/dashboard/components/stat-card"
import { ResultChip } from "@/components/broadcast/result-chip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import type { H2hMatch } from "@/features/dashboard/schemas/insights"

// The head-to-head panel on compare (§5.1): shown only when exactly two
// players are selected. If they've met, their record and the match history;
// if not, an honest note. Lives in its own component so the h2h hook only
// runs when there are two players to compare.
//
// The record drills (§3.4): under the history sits every rally the pair have
// played, straight from `h2h_rallies` — the same filtered SQL the aggregate
// above it used, so the list can never disagree with the numbers.

/** The pair's rallies, fetched only once asked for. Everything else on this
 *  panel is an aggregate; this is the raw material behind it. */
function RalliesBehind({
  player1Id,
  player2Id,
}: {
  player1Id: string
  player2Id: string
}) {
  const [open, setOpen] = useState(false)
  const rallies = useH2hRallies(player1Id, player2Id, {}, open)

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
        {open ? "Hide the rallies" : "Show the rallies behind it"}
      </Button>

      {open &&
        (rallies.data ? (
          // scores read from the first-named player's side, the same
          // perspective the record above is stated in
          <RallyTable rallies={rallies.data} playerId={player1Id} />
        ) : (
          <Skeleton className="h-48 w-full" />
        ))}
    </div>
  )
}

/** One match in the pair's history, read from the first-named player's side.
 *  A draw and a match still in play are different things — only the decided
 *  ones and the draw take a chip. */
function HistoryRow({
  match: m,
  p1Name,
  p2Name,
}: {
  match: H2hMatch
  p1Name: string
  p2Name: string
}) {
  const winner =
    m.outcome === "p1" ? p1Name : m.outcome === "p2" ? p2Name : undefined

  return (
    <li>
      <Link
        to="/matches/$matchId"
        params={{ matchId: m.match_id }}
        search={{ rally: undefined }}
        className="flex items-center justify-between gap-3 border-l-4 border-border bg-card px-3 py-2 transition-colors hover:border-primary hover:bg-accent"
      >
        <span className="text-sm text-muted-foreground tabular-nums">
          {m.date}
        </span>
        <span className="flex items-center gap-3">
          {winner && <span className="truncate text-sm">{winner}</span>}
          <span className="font-heading text-base font-bold tabular-nums">
            {m.games_won_p1}–{m.games_won_p2}
          </span>
          {m.outcome === "pending" ? (
            <span className="font-heading text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
              In play
            </span>
          ) : (
            <ResultChip
              result={m.outcome === "p1" ? "w" : m.outcome === "p2" ? "l" : "d"}
            />
          )}
        </span>
      </Link>
    </li>
  )
}

export function H2hPanel({
  player1Id,
  player2Id,
  p1Name,
  p2Name,
}: {
  player1Id: string
  player2Id: string
  p1Name: string
  p2Name: string
}) {
  const h2h = useH2h(player1Id, player2Id)
  if (!h2h.data) return <Skeleton className="h-32 w-full" />

  const h = h2h.data
  const played = h.games_decided > 0 || h.match_history.length > 0

  return (
    <ProfileSection title={`${p1Name} vs ${p2Name}`}>
      {!played ? (
        <p className="text-sm text-muted-foreground">
          They haven&rsquo;t played each other yet.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-1.5">
            <StatCard
              label="Games"
              value={`${h.games_won_p1}–${h.games_won_p2}`}
            />
            <StatCard
              label="Matches"
              value={`${h.matches_won_p1}–${h.matches_won_p2}`}
            />
          </div>

          {h.match_history.length > 0 && (
            <ul className="flex flex-col gap-0.5">
              {h.match_history.map((m) => (
                <HistoryRow
                  key={m.match_id}
                  match={m}
                  p1Name={p1Name}
                  p2Name={p2Name}
                />
              ))}
            </ul>
          )}

          <RalliesBehind player1Id={player1Id} player2Id={player2Id} />
        </div>
      )}
    </ProfileSection>
  )
}
