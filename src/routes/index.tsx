import { createFileRoute, Link } from "@tanstack/react-router"

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
import {
  homeCountsQueryOptions,
  useHomeCounts,
} from "@/features/dashboard/api/get-home-counts"
import { prefetchPlayerInsights } from "@/features/dashboard/api/use-player-insights"
import {
  recentResultsQueryOptions,
  useRecentResults,
} from "@/features/dashboard/api/get-recent-results"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { MatchResultSummary } from "@/lib/schemas/match"

// The home hub (§5.1): the front door. Data is fetched in the loader and
// dehydrated into the HTML, so the roster and recent matches are in the
// server-rendered markup (view-source), not painted in after hydration.

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const { queryClient } = context
    const players = await queryClient.ensureQueryData(playersQueryOptions())
    await Promise.all([
      queryClient.ensureQueryData(recentResultsQueryOptions()),
      queryClient.ensureQueryData(homeCountsQueryOptions()),
      // warm each card's stats so the roster is complete in the SSR markup
      ...players.map((p) => prefetchPlayerInsights(queryClient, p.id)),
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

  const roster = usePlayers()
  const results = useRecentResults()
  const counts = useHomeCounts()

  const players = roster.data ?? []
  const nameOf = new Map(players.map((p) => [p.id, p.name]))

  return (
    <main className="container mx-auto max-w-5xl px-4 pb-16">
      {/* hero */}
      <section className="flex items-center gap-6 py-12">
        <CourtDiagram className="h-24 w-16 shrink-0 text-muted-foreground" />
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Every rally, counted.
          </h1>
          <p className="mt-2 text-sm text-balance text-muted-foreground">
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
          <Button asChild variant="ghost" size="sm">
            <Link to="/compare" search={{ mode: "all" }}>
              Compare
            </Link>
          </Button>
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 sm:gap-6">
            {players.map((p, i) => (
              <RosterCard
                key={p.id}
                player={p}
                side={i % 2 === 0 ? "p1" : "p2"}
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
  const hasScore = match.games_won_p1 !== null && match.games_won_p2 !== null

  return (
    <li>
      <Link
        to="/matches/$matchId"
        params={{ matchId: match.match_id }}
        className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/50"
      >
        <span className="w-24 shrink-0 text-sm text-muted-foreground tabular-nums">
          {formatDate(match.date)}
        </span>
        <span className="flex-1 truncate text-sm">
          <span className={match.outcome === "p1" ? "font-semibold" : ""}>
            {p1}
          </span>{" "}
          <span className="text-muted-foreground">vs</span>{" "}
          <span className={match.outcome === "p2" ? "font-semibold" : ""}>
            {p2}
          </span>
        </span>
        {hasScore && (
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {match.games_won_p1}–{match.games_won_p2}
          </span>
        )}
        {(match.outcome === "draw" || match.outcome === "pending") && (
          <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
            {match.outcome === "draw" ? "Draw" : "In play"}
          </span>
        )}
        {match.ball_type && <BallDots ball={match.ball_type} />}
      </Link>
    </li>
  )
}
