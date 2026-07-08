import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { z } from "zod"

import {
  matchDetailQueryOptions,
  useMatchDetail,
} from "@/lib/api/get-match-detail"
import { H2hBars } from "@/features/dashboard/components/h2h-bars"
import { MatchMomentum } from "@/features/dashboard/components/match-momentum"
import { MatchScoreboard } from "@/features/dashboard/components/match-scoreboard"
import { foldMatchToScored } from "@/features/dashboard/lib/fold-match"
import { humanise } from "@/features/dashboard/lib/humanise"
import { computeMatchStats } from "@/features/dashboard/lib/match-stats"
import { RallyTimeline } from "@/features/logger/components/rally-timeline"
import { BallDots } from "@/components/ball-dots"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { CourtEmptyMedia } from "@/components/court/court-empty"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { H2hBarRow } from "@/features/dashboard/components/h2h-bars"
import type { RallyRow } from "@/lib/rally/rally-draft"
import type { RallyScored } from "@/lib/schemas/rally"

// Match detail (§5.2): one match told summary-first — who won, then the shape
// of it (games strip), then the story (momentum), then the why (head-to-head),
// then the receipts (rallies). The games strip is the lens: tap a game and
// momentum, head-to-head, AND the rally list rescope to it — rallies show one
// game at a time, the point-by-point pattern. `?rally=<id>` deep-links by
// focusing the lens on that game and highlighting the row in place.

const matchSearch = z.object({
  rally: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/matches/$matchId")({
  validateSearch: (search) => matchSearch.parse(search),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        matchDetailQueryOptions(params.matchId)
      ),
      context.queryClient.ensureQueryData(playersQueryOptions()),
    ])
  },
  component: MatchDetailPage,
})

function toRallyRow(r: RallyScored): RallyRow {
  return {
    id: r.id,
    game_id: r.game_id,
    rally_number: r.rally_number,
    server_id: r.server_id,
    serve_side: r.serve_side,
    serve_number: r.serve_number === 2 ? 2 : 1,
    winner_id: r.winner_id,
    end_reason: r.end_reason,
    error_detail: r.error_detail,
    forced: r.forced,
    shot_type: r.shot_type,
    shot_count: r.shot_count,
  }
}

function formatLabel(format: number | null) {
  return format === null ? "Casual" : `Best of ${format}`
}

/** "2026-07-04" → "4 Jul 2026" — a date in prose reads as words, not data. */
function humanDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`))
}

function MatchDetailPage() {
  const { matchId } = Route.useParams()
  const search = Route.useSearch()
  const { user } = Route.useRouteContext()
  const match = useMatchDetail(matchId)
  const players = usePlayers()

  const [lens, setLens] = useState("match")
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const folded = match.data ? foldMatchToScored(match.data) : []
  const allRows = folded.flatMap((g) => g.rows)

  // deep link: focus the lens on the rally's game and mark the row out in
  // place — the row already tells the whole story, so there's no sheet to
  // open. The scroll waits for the lensed timeline to render (second effect)
  // so the row exists before we jump to it.
  const matchData = match.data
  useEffect(() => {
    if (!search.rally || !matchData) return
    const game = matchData.games.find((g) =>
      g.rallies.some((r) => r.id === search.rally)
    )
    if (!game) return
    setLens(game.id)
    setHighlightId(search.rally)
  }, [search.rally, matchData])
  useEffect(() => {
    if (!highlightId) return
    // defer past the router's own scroll-to-top on navigation, which would
    // otherwise land after ours and win
    const timer = setTimeout(() => {
      document
        .getElementById(`rally-${highlightId}`)
        ?.scrollIntoView({ block: "center" })
    }, 150)
    return () => clearTimeout(timer)
  }, [highlightId, lens])

  if (!match.data || !players.data) {
    return (
      <main className="container mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </main>
    )
  }

  const m = match.data
  const nameOf = (id: string) =>
    players.data.find((p) => p.id === id)?.name ?? "Unknown"
  const p1Name = nameOf(m.player1_id)
  const p2Name = nameOf(m.player2_id)

  const results = folded.map((g) => {
    const last = g.rows.at(-1)
    const scoreP1 = last?.score_p1 ?? 0
    const scoreP2 = last?.score_p2 ?? 0
    const winner =
      scoreP1 > scoreP2 ? m.player1_id : scoreP2 > scoreP1 ? m.player2_id : null
    return { ...g, scoreP1, scoreP2, winner }
  })
  const gamesWonP1 = results.filter((r) => r.winner === m.player1_id).length
  const gamesWonP2 = results.filter((r) => r.winner === m.player2_id).length
  const matchWinner =
    gamesWonP1 > gamesWonP2
      ? m.player1_id
      : gamesWonP2 > gamesWonP1
        ? m.player2_id
        : null

  // the lens scopes the momentum and the head-to-head; "match" = everything
  const scopedGames =
    lens === "match" ? folded : folded.filter((g) => g.gameId === lens)
  const stats = computeMatchStats(
    scopedGames.flatMap((g) => g.rows),
    m.player1_id
  )
  const lensLabel =
    lens === "match" ? "Match" : `Game ${scopedGames[0]?.gameNumber ?? "?"}`

  const pct = (won: number, total: number) =>
    total === 0 ? "—" : `${Math.round((won / total) * 100)}%`
  const statRows: Array<H2hBarRow> = [
    { label: "Points won", v1: stats.points.p1, v2: stats.points.p2 },
    { label: "Winners", v1: stats.winners.p1, v2: stats.winners.p2 },
    {
      label: "Errors",
      v1: stats.errors.p1,
      v2: stats.errors.p2,
      betterIsLower: true,
    },
    { label: "Aces", v1: stats.aces.p1, v2: stats.aces.p2 },
    { label: "Strokes", v1: stats.strokes.p1, v2: stats.strokes.p2 },
    { label: "Longest run", v1: stats.bestRun.p1, v2: stats.bestRun.p2 },
    {
      label: "Points won on serve",
      v1:
        stats.serveTotal.p1 === 0 ? 0 : stats.serveWon.p1 / stats.serveTotal.p1,
      v2:
        stats.serveTotal.p2 === 0 ? 0 : stats.serveWon.p2 / stats.serveTotal.p2,
      display: [
        pct(stats.serveWon.p1, stats.serveTotal.p1),
        pct(stats.serveWon.p2, stats.serveTotal.p2),
      ],
      sr: [
        `${stats.serveWon.p1} of ${stats.serveTotal.p1} serves`,
        `${stats.serveWon.p2} of ${stats.serveTotal.p2} serves`,
      ],
    },
  ]

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/matches" search={{ page: 1 }}>
                  Matches
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {p1Name} vs {p2Name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {user && (
          <Button asChild variant="outline" size="sm">
            <Link
              to="/manage"
              search={{
                tab: "rallies",
                q: matchId,
                page: 1,
                sort: "",
                dir: "desc",
              }}
            >
              Edit in manage
            </Link>
          </Button>
        )}
      </div>

      {/* scoreboard: the answer first */}
      <header className="flex flex-col gap-3">
        <h1 className="sr-only">
          {p1Name} {gamesWonP1}–{gamesWonP2} {p2Name}
        </h1>
        <MatchScoreboard
          p1Name={p1Name}
          p2Name={p2Name}
          gamesWonP1={gamesWonP1}
          gamesWonP2={gamesWonP2}
          winner={
            matchWinner === null
              ? null
              : matchWinner === m.player1_id
                ? "p1"
                : "p2"
          }
        />
        {/* two lines, grouped by kind: when-and-where, then what-was-played */}
        <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
          <span>
            {humanDate(m.date)}
            {m.venue && ` · ${m.venue}`}
          </span>
          <span className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>{formatLabel(m.format)}</span>
            {m.ball_type && (
              <span className="flex items-center gap-1.5">
                · <BallDots ball={m.ball_type} />
                {humanise(m.ball_type)} ball
              </span>
            )}
            <span className="tabular-nums">
              · {allRows.length} {allRows.length === 1 ? "rally" : "rallies"}
            </span>
          </span>
        </div>
        {matchWinner === null && allRows.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Level on games — no match winner.
          </p>
        )}
      </header>

      {/* the games strip doubles as the lens */}
      {results.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex-wrap"
            value={lens}
            onValueChange={(v) => v && setLens(v)}
          >
            <ToggleGroupItem value="match">Match</ToggleGroupItem>
            {results.map((g) => (
              <ToggleGroupItem
                key={g.gameId}
                value={g.gameId}
                aria-label={`Game ${g.gameNumber}: ${g.scoreP1}–${g.scoreP2}${
                  g.winner ? `, won by ${nameOf(g.winner)}` : ""
                }`}
                className="tabular-nums"
              >
                {g.winner && (
                  <span
                    aria-hidden
                    className={cn(
                      "size-2 rounded-full",
                      g.winner === m.player1_id ? "bg-primary" : "bg-foreground"
                    )}
                  />
                )}
                <span
                  className={cn(g.winner === m.player1_id && "font-semibold")}
                >
                  {g.scoreP1}
                </span>
                –
                <span
                  className={cn(g.winner === m.player2_id && "font-semibold")}
                >
                  {g.scoreP2}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            Game scores read {p1Name}–{p2Name}; the dot marks the game winner.
          </p>
        </div>
      )}

      {allRows.length === 0 && (
        <Empty>
          <EmptyHeader>
            <CourtEmptyMedia />
            <EmptyTitle className="font-heading">
              No rallies logged yet
            </EmptyTitle>
            <EmptyDescription>
              The story of this match — momentum, head-to-head, the rally log —
              appears once its rallies are in.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {allRows.length > 0 && (
        <>
          {/* the story */}
          <section className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-bold">Momentum</h2>
            <p className="mb-2 text-sm text-muted-foreground">
              Who was ahead, rally by rally.
            </p>
            <MatchMomentum
              games={scopedGames}
              p1Name={p1Name}
              p2Name={p2Name}
            />
          </section>

          {/* the why — bounded measure so the mirrored bars keep their proportions */}
          <section className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-bold">Head-to-head</h2>
            <p className="mb-2 text-sm text-muted-foreground">
              {lensLabel} totals.
            </p>
            <div className="mx-auto w-full max-w-3xl">
              <H2hBars rows={statRows} />
            </div>
          </section>

          {/* the receipts — appear only once a game is picked (the
              point-by-point pattern: choose a game, step through it) */}
          {lens !== "match" && scopedGames.length === 1 && (
            <section className="flex flex-col gap-1">
              <h2 className="font-heading text-lg font-bold">
                {lensLabel} rallies
              </h2>
              <p className="mb-2 text-sm text-muted-foreground">
                Newest first — the L or R by the score is the serving box, on
                the server&rsquo;s side.
              </p>
              <RallyTimeline
                rows={scopedGames[0].rows.map(toRallyRow)}
                p1Id={m.player1_id}
                p1Name={p1Name}
                p2Name={p2Name}
                highlightId={highlightId}
                showNames
              />
            </section>
          )}
        </>
      )}
    </main>
  )
}
