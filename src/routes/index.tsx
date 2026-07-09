import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { BallDots } from "@/components/ball-dots"
import { CountUp } from "@/components/count-up"
import { CourtDiagram } from "@/components/court/court-diagram"
import { CourtEmptyMedia } from "@/components/court/court-empty"
import { RosterCard } from "@/features/dashboard/components/roster-card"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { homeCountsQueryOptions, useHomeCounts } from "@/features/dashboard/api/get-home-counts"
import {
  playersHeadlineOptions,
  usePlayersHeadline,
} from "@/features/dashboard/api/get-players-headline"
import {
  recentResultsQueryOptions,
  useRecentResults,
} from "@/features/dashboard/api/get-recent-results"

import type { MatchResultSummary } from "@/lib/schemas/match"

// The home hub (§5.1): the front door. Data is fetched in the loader and
// dehydrated into the HTML, so the roster and recent matches are in the
// server-rendered markup (view-source), not painted in after hydration.

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(playersHeadlineOptions()),
      context.queryClient.ensureQueryData(recentResultsQueryOptions()),
      context.queryClient.ensureQueryData(homeCountsQueryOptions()),
    ])
  },
  component: HomePage,
})

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function HomePage() {
  const { user } = Route.useRouteContext()
  const owner = user !== null
  const navigate = useNavigate()

  const roster = usePlayersHeadline()
  const results = useRecentResults()
  const counts = useHomeCounts()

  const [selected, setSelected] = useState<Array<string>>([])
  const toggleSelect = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const players = roster.data ?? []
  const nameOf = new Map(players.map((p) => [p.player_id, p.name]))

  return (
    <main className="container mx-auto max-w-5xl px-4 pb-16">
      {/* hero */}
      <section className="flex items-center gap-6 py-12">
        <CourtDiagram className="text-muted-foreground h-24 w-16 shrink-0" />
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Every rally, counted.
          </h1>
          <p className="text-muted-foreground mt-2 text-sm text-balance">
            {counts.data && counts.data.matches > 0 ? (
              <>
                <CountUp value={counts.data.rallies} /> rallies logged across{" "}
                <CountUp value={counts.data.matches} />{" "}
                {counts.data.matches === 1 ? "match" : "matches"}.
              </>
            ) : (
              "Squash matches logged point by point — who won, how, and what it says about the way we play."
            )}
          </p>
        </div>
      </section>

      {/* roster */}
      <section className="flex flex-col gap-4 border-t pt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">Players</h2>
          {selected.length >= 2 && (
            <Button
              type="button"
              onClick={() =>
                void navigate({
                  to: "/compare",
                  search: { players: selected.join(","), mode: "all" },
                })
              }
            >
              Compare {selected.length} players
            </Button>
          )}
        </div>

        {players.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <CourtEmptyMedia />
              <EmptyTitle className="font-heading">No players yet</EmptyTitle>
              <EmptyDescription>
                {owner
                  ? "Log your first match to build the roster."
                  : "The roster fills in once the first match is logged."}
              </EmptyDescription>
            </EmptyHeader>
            {owner && (
              <Button asChild>
                <Link to="/entry">Log a match</Link>
              </Button>
            )}
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <RosterCard
                key={p.player_id}
                player={p}
                selected={selected.includes(p.player_id)}
                onToggleSelect={() => toggleSelect(p.player_id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* recent matches */}
      {(results.data ?? []).length > 0 && (
        <section className="mt-12 flex flex-col gap-4 border-t pt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold">Recent matches</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/matches" search={{ page: 1 }}>
                View all
              </Link>
            </Button>
          </div>
          <ul className="flex flex-col divide-y">
            {(results.data ?? []).map((m) => (
              <RecentMatchRow key={m.match_id} match={m} nameOf={nameOf} />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

function RecentMatchRow({
  match,
  nameOf,
}: {
  match: MatchResultSummary
  nameOf: Map<string, string>
}) {
  const p1 = nameOf.get(match.player1_id) ?? "Unknown"
  const p2 = nameOf.get(match.player2_id) ?? "Unknown"
  const hasScore =
    match.games_won_p1 !== null && match.games_won_p2 !== null

  return (
    <li>
      <Link
        to="/matches/$matchId"
        params={{ matchId: match.match_id }}
        className="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5"
      >
        <span className="text-muted-foreground w-24 shrink-0 text-sm tabular-nums">
          {formatDate(match.date)}
        </span>
        <span className="flex-1 truncate text-sm">
          <span
            className={
              match.match_winner_id === match.player1_id ? "font-semibold" : ""
            }
          >
            {p1}
          </span>{" "}
          <span className="text-muted-foreground">vs</span>{" "}
          <span
            className={
              match.match_winner_id === match.player2_id ? "font-semibold" : ""
            }
          >
            {p2}
          </span>
        </span>
        {hasScore && (
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {match.games_won_p1}–{match.games_won_p2}
          </span>
        )}
        {match.ball_type && <BallDots ball={match.ball_type} />}
      </Link>
    </li>
  )
}
