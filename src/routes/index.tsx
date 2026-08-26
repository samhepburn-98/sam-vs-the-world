import { createFileRoute, Link } from "@tanstack/react-router"

import { CountUp } from "@/components/count-up"
import { CourtEmptyMedia } from "@/components/court/court-empty"
import { Overline, PageTitle } from "@/components/typography"
import { Ticker } from "@/components/ticker"
import { FeaturedPlayer } from "@/features/dashboard/components/featured-player"
import { MatchRow } from "@/features/dashboard/components/match-row"
import { RosterRow } from "@/features/dashboard/components/roster-row"
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
import type { PlayerSummary } from "@/lib/schemas/player"

// The home hub (§5.1): the front door as a broadcast rundown — headline,
// last-match ticker, the featured player with the pundit callouts, the
// roster as result-row graphics, recent matches. Data is fetched in the
// loader and dehydrated into the HTML, so it's all in the server-rendered
// markup (view-source), not painted in after hydration.

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const { queryClient } = context
    const players = await queryClient.ensureQueryData(playersQueryOptions())
    await Promise.all([
      queryClient.ensureQueryData(recentResultsQueryOptions()),
      queryClient.ensureQueryData(homeCountsQueryOptions()),
      // warm each player's stats so the rundown is complete in the SSR markup
      ...players.map((p) => prefetchPlayerInsights(queryClient, p.id)),
    ])
  },
  component: HomePage,
})

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

function tickerDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

/** The one-line result for the ticker: winner first, in plain words. */
function tickerLine(m: MatchResultSummary, nameOf: Map<string, string>) {
  const p1 = nameOf.get(m.player1_id) ?? "Unknown"
  const p2 = nameOf.get(m.player2_id) ?? "Unknown"
  const s1 = m.games_won_p1 ?? 0
  const s2 = m.games_won_p2 ?? 0
  if (m.outcome === "p1") return `${p1} beat ${p2} ${s1}–${s2}`
  if (m.outcome === "p2") return `${p2} beat ${p1} ${s2}–${s1}`
  if (m.outcome === "draw") return `${p1} ${s1}–${s2} ${p2} · drawn`
  return `In play · ${p1} v ${p2}`
}

/** A player's recent results, oldest first, from the matches on this page. */
function formFor(
  playerId: string,
  results: Array<MatchResultSummary>
): Array<"w" | "l" | "d"> {
  return results
    .slice()
    .reverse()
    .filter(
      (m) =>
        (m.player1_id === playerId || m.player2_id === playerId) &&
        m.outcome !== "pending"
    )
    .map((m) => {
      if (m.outcome === "draw") return "d"
      const winner = m.outcome === "p1" ? m.player1_id : m.player2_id
      return winner === playerId ? "w" : "l"
    })
}

function HomePage() {
  const { user } = Route.useRouteContext()
  const owner = user !== null

  const roster = usePlayers()
  const results = useRecentResults()
  const counts = useHomeCounts()

  const players = roster.data ?? []
  const nameOf = new Map(players.map((p) => [p.id, p.name]))
  const recent = results.data ?? []

  // the featured slot goes to the protagonist; everyone else is the roster
  const featured: PlayerSummary | undefined =
    players.find((p) => p.is_protagonist) ?? players.at(0)
  const others = players.filter((p) => p.id !== featured?.id)
  const lastMatch = recent.at(0)

  return (
    <main className="pb-16">
      {/* headline */}
      <section className="container mx-auto max-w-5xl px-4 pt-10 pb-6">
        <PageTitle className="text-5xl">Every rally, counted.</PageTitle>
        <p className="mt-2 flex items-center gap-2.5 text-sm text-muted-foreground">
          <span aria-hidden className="h-[3px] w-7 shrink-0 bg-primary" />
          {counts.data && counts.data.matches > 0 ? (
            <span>
              <CountUp value={counts.data.rallies} /> rallies logged across{" "}
              <CountUp value={counts.data.matches} />{" "}
              {counts.data.matches === 1 ? "match" : "matches"}
            </span>
          ) : (
            "Squash matches logged point by point — who won, how, and what it says about the way we play."
          )}
        </p>
      </section>

      {/* last-match ticker, full bleed */}
      {lastMatch && (
        <Ticker
          items={[
            "Last match",
            tickerLine(lastMatch, nameOf),
            `${tickerDate(lastMatch.date)}${lastMatch.venue ? ` · ${lastMatch.venue}` : ""}`,
          ]}
        />
      )}

      <div className="container mx-auto flex max-w-5xl flex-col gap-10 px-4 pt-8">
        {players.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <CourtEmptyMedia />
              <EmptyTitle className="font-heading uppercase">
                No players yet
              </EmptyTitle>
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
          <>
            {/* featured player */}
            {featured && (
              <section className="flex flex-col gap-3">
                <Overline as="h2">Featured player</Overline>
                <FeaturedPlayer player={featured} />
              </section>
            )}

            {/* the roster */}
            {others.length > 0 && (
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Overline as="h2">The roster</Overline>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/compare" search={{ mode: "all" }}>
                      Compare
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {others.map((p, i) => (
                    <RosterRow
                      key={p.id}
                      player={p}
                      side={i % 2 === 0 ? "p1" : "p2"}
                      form={formFor(p.id, recent)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* recent matches */}
        {recent.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Overline as="h2">Recent matches</Overline>
              <Button asChild variant="ghost" size="sm">
                <Link to="/matches" search={{ page: 1 }}>
                  View all
                </Link>
              </Button>
            </div>
            <ul className="flex flex-col gap-1.5">
              {recent.map((m) => (
                <li key={m.match_id}>
                  <MatchRow
                    matchId={m.match_id}
                    date={m.date}
                    name1={nameOf.get(m.player1_id) ?? "Unknown"}
                    name2={nameOf.get(m.player2_id) ?? "Unknown"}
                    score1={m.games_won_p1}
                    score2={m.games_won_p2}
                    outcome={m.outcome}
                    venue={m.venue}
                    ball={m.ball_type}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
