import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { z } from "zod"

import {
  matchDetailQueryOptions,
  useMatchDetail,
} from "@/lib/api/get-match-detail"
import {
  matchResultQueryOptions,
  useMatchResult,
} from "@/lib/api/get-match-result"
import { GameScoreChart } from "@/features/dashboard/components/game-score-chart"
import { RallyDetailSheet } from "@/features/dashboard/components/rally-detail-sheet"
import { foldMatchToScored } from "@/features/dashboard/lib/fold-match"
import { humanise } from "@/features/dashboard/lib/humanise"
import { RallyTimeline } from "@/features/logger/components/rally-timeline"
import { BallDots } from "@/components/broadcast/ball-dots"
import { Overline, SectionTitle } from "@/components/typography"
import { ScoreStrip } from "@/components/broadcast/score-strip"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { RallyRow } from "@/lib/rally/rally-draft"
import type { RallyScored } from "@/lib/schemas/rally"

// Match detail (§5.2): the deep-drill target — one match told in full. The
// rallies are folded into the scored shape client-side (§8.4 exception), so
// the two-sided timeline, the momentum strip, and the rally sheet all read
// one consistent structure. The match-level verdict is NOT recomputed here:
// match_results owns the clinch/draw/pending rule, and the header renders
// whatever the view says. `?rally=<id>` opens and scrolls to a rally.

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
      context.queryClient.ensureQueryData(
        matchResultQueryOptions(params.matchId)
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
    winning_shot: r.winning_shot,
    losing_shot: r.losing_shot,
    shot_count: r.shot_count,
  }
}

function formatBadge(format: number | null) {
  return format === null ? "Casual" : `Best of ${format}`
}

function MatchDetailPage() {
  const { matchId } = Route.useParams()
  const search = Route.useSearch()
  const { user } = Route.useRouteContext()
  const match = useMatchDetail(matchId)
  const result = useMatchResult(matchId)
  const players = usePlayers()

  const [selected, setSelected] = useState<number | null>(null)
  const gameRefs = useRef<Record<string, HTMLElement | null>>({})

  const folded = match.data ? foldMatchToScored(match.data) : []
  const allRows = folded.flatMap((g) => g.rows)

  // deep link: open + scroll to the target rally once the data is in. Recompute
  // the rows inside so the effect depends only on the param and the fetch, not
  // on a fresh array each render (which would re-open the sheet endlessly).
  const matchData = match.data
  useEffect(() => {
    if (!search.rally || !matchData) return
    const rows = foldMatchToScored(matchData).flatMap((g) => g.rows)
    const idx = rows.findIndex((r) => r.id === search.rally)
    if (idx < 0) return
    setSelected(idx)
    gameRefs.current[rows[idx].game_id]?.scrollIntoView({ block: "center" })
  }, [search.rally, matchData])

  if (!match.data || !result.data || !players.data) {
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
  // the match-level verdict is the view's, never recomputed here — the
  // clinch rule lives in match_results (and lib/scoring for the logger)
  const verdict = result.data
  const gamesWonP1 = verdict.games_won_p1 ?? 0
  const gamesWonP2 = verdict.games_won_p2 ?? 0

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
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

      {/* header */}
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums">
            {m.date}
          </span>
          {m.venue && (
            <span className="text-sm text-muted-foreground">· {m.venue}</span>
          )}
          <Badge variant="outline">{formatBadge(m.format)}</Badge>
          {m.ball_type && (
            <span className="flex items-center gap-1.5 text-sm">
              <BallDots ball={m.ball_type} />
              {humanise(m.ball_type)}
            </span>
          )}
        </div>
        {/* the full-time graphic: status overline, then the deep score strip
            with the winner's score in their side's colour */}
        <div className="flex flex-col gap-1.5 pt-1">
          <Overline
            as="h2"
            tone={verdict.outcome === "pending" ? "primary" : "muted"}
          >
            {verdict.outcome === "pending"
              ? "In play"
              : verdict.outcome === "draw"
                ? "Drawn"
                : "Full time"}
          </Overline>
          <ScoreStrip
            name1={p1Name}
            name2={p2Name}
            score1={gamesWonP1}
            score2={gamesWonP2}
            outcome={
              verdict.outcome === "p1" || verdict.outcome === "p2"
                ? verdict.outcome
                : null
            }
          />
        </div>
        {user && (
          <div className="pt-1">
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
          </div>
        )}
      </header>

      {/* game strip */}
      <div className="flex flex-wrap gap-2">
        {results.map((g) => (
          <button
            key={g.gameId}
            type="button"
            onClick={() =>
              gameRefs.current[g.gameId]?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium tabular-nums ring-1 ring-foreground/10 transition-colors hover:bg-muted/60",
              g.winner === m.player1_id && "bg-primary/10",
              g.winner === m.player2_id && "bg-p2/10"
            )}
          >
            <span className="mr-2 text-xs text-muted-foreground">
              G{g.gameNumber}
            </span>
            {g.scoreP1}–{g.scoreP2}
          </button>
        ))}
      </div>

      {/* per-game timeline + momentum */}
      {folded.map((g, gi) => (
        <section
          key={g.gameId}
          ref={(el) => {
            gameRefs.current[g.gameId] = el
          }}
          className="flex scroll-mt-4 flex-col gap-3"
        >
          <SectionTitle>Game {g.gameNumber}</SectionTitle>
          <GameScoreChart rows={g.rows} p1Name={p1Name} p2Name={p2Name} />
          <RallyTimeline
            rows={g.rows.map(toRallyRow)}
            p1Id={m.player1_id}
            p1Name={p1Name}
            p2Name={p2Name}
            servesPerPoint={m.serves_per_point}
            editable
            onRowClick={(row) => {
              const idx = allRows.findIndex((r) => r.id === row.id)
              if (idx >= 0) setSelected(idx)
            }}
          />
          {gi < folded.length - 1 && <div className="border-b" />}
        </section>
      ))}

      <RallyDetailSheet
        rally={selected === null ? null : allRows[selected]}
        showMatchLink={false}
        onClose={() => setSelected(null)}
        onPrev={() => setSelected((i) => (i === null ? i : Math.max(0, i - 1)))}
        onNext={() =>
          setSelected((i) =>
            i === null ? i : Math.min(allRows.length - 1, i + 1)
          )
        }
        hasPrev={selected !== null && selected > 0}
        hasNext={selected !== null && selected < allRows.length - 1}
      />
    </main>
  )
}
