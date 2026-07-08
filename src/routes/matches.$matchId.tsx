import { createFileRoute, Link } from "@tanstack/react-router"
import { ChevronDownIcon, ListIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { z } from "zod"

import {
  matchDetailQueryOptions,
  useMatchDetail,
} from "@/lib/api/get-match-detail"
import { H2hBars } from "@/features/dashboard/components/h2h-bars"
import { MatchMomentum } from "@/features/dashboard/components/match-momentum"
import { MatchScoreboard } from "@/features/dashboard/components/match-scoreboard"
import { RallyDetailSheet } from "@/features/dashboard/components/rally-detail-sheet"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { H2hBarRow } from "@/features/dashboard/components/h2h-bars"
import type { RallyRow } from "@/lib/rally/rally-draft"
import type { RallyScored } from "@/lib/schemas/rally"

// Match detail (§5.2): one match told summary-first — who won, then the shape
// of it (games strip), then the story (momentum), then the why (head-to-head)
// — with the rally-level receipts collapsed at the bottom. The games strip is
// also the lens: tap a game and the momentum and head-to-head rescope to it.
// `?rally=<id>` still deep-links — it expands the log and opens the sheet.

const matchSearch = z.object({
  rally: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/matches/$matchId")({
  validateSearch: (search) => matchSearch.parse(search),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        matchDetailQueryOptions(params.matchId),
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

function formatBadge(format: number | null) {
  return format === null ? "Casual" : `Best of ${format}`
}

function MatchDetailPage() {
  const { matchId } = Route.useParams()
  const search = Route.useSearch()
  const { user } = Route.useRouteContext()
  const match = useMatchDetail(matchId)
  const players = usePlayers()

  const [lens, setLens] = useState("match")
  const [logOpen, setLogOpen] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const gameRefs = useRef<Record<string, HTMLElement | null>>({})
  const pendingScrollGame = useRef<string | null>(null)

  const folded = match.data ? foldMatchToScored(match.data) : []
  const allRows = folded.flatMap((g) => g.rows)

  // deep link: expand the log, open the sheet, and scroll once the data is
  // in. The scroll waits for the expanded log to render (second effect) so
  // the game section's ref exists before we jump to it.
  const matchData = match.data
  useEffect(() => {
    if (!search.rally || !matchData) return
    const rows = foldMatchToScored(matchData).flatMap((g) => g.rows)
    const idx = rows.findIndex((r) => r.id === search.rally)
    if (idx < 0) return
    setSelected(idx)
    setLogOpen(true)
    pendingScrollGame.current = rows[idx].game_id
  }, [search.rally, matchData])
  useEffect(() => {
    if (!logOpen || !pendingScrollGame.current) return
    gameRefs.current[pendingScrollGame.current]?.scrollIntoView({
      block: "center",
    })
    pendingScrollGame.current = null
  }, [logOpen, search.rally])

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
      scoreP1 > scoreP2
        ? m.player1_id
        : scoreP2 > scoreP1
          ? m.player2_id
          : null
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
    m.player1_id,
  )
  const lensLabel =
    lens === "match"
      ? "Match"
      : `Game ${scopedGames[0]?.gameNumber ?? "?"}`

  const pct = (won: number, total: number) =>
    total === 0 ? "—" : `${Math.round((won / total) * 100)}%`
  const statRows: Array<H2hBarRow> = [
    { label: "Winners", v1: stats.winners.p1, v2: stats.winners.p2 },
    {
      label: "Errors",
      v1: stats.errors.p1,
      v2: stats.errors.p2,
      betterIsLower: true,
    },
    { label: "Aces", v1: stats.aces.p1, v2: stats.aces.p2 },
    {
      label: "Points won on serve",
      v1: stats.serveTotal.p1 === 0 ? 0 : stats.serveWon.p1 / stats.serveTotal.p1,
      v2: stats.serveTotal.p2 === 0 ? 0 : stats.serveWon.p2 / stats.serveTotal.p2,
      display: [
        pct(stats.serveWon.p1, stats.serveTotal.p1),
        pct(stats.serveWon.p2, stats.serveTotal.p2),
      ],
      detail: [
        `${stats.serveWon.p1}/${stats.serveTotal.p1}`,
        `${stats.serveWon.p2}/${stats.serveTotal.p2}`,
      ],
    },
  ]

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
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
              search={{ tab: "rallies", q: matchId, page: 1, sort: "", dir: "desc" }}
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
        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
          <span className="tabular-nums">{m.date}</span>
          {m.venue && <span>· {m.venue}</span>}
          <Badge variant="outline">{formatBadge(m.format)}</Badge>
          {m.ball_type && (
            <span className="flex items-center gap-1.5">
              <BallDots ball={m.ball_type} />
              {humanise(m.ball_type)}
            </span>
          )}
          <span className="tabular-nums">
            · {allRows.length} {allRows.length === 1 ? "rally" : "rallies"}
          </span>
        </div>
        {matchWinner === null && (
          <p className="text-muted-foreground text-center text-sm">
            Casual session.
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
                      g.winner === m.player1_id
                        ? "bg-primary"
                        : "bg-foreground",
                    )}
                  />
                )}
                <span className={cn(g.winner === m.player1_id && "font-semibold")}>
                  {g.scoreP1}
                </span>
                –
                <span className={cn(g.winner === m.player2_id && "font-semibold")}>
                  {g.scoreP2}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-muted-foreground text-xs">
            Game scores read {p1Name}–{p2Name}; the dot marks the game winner.
          </p>
        </div>
      )}

      {/* the story */}
      <section className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold">Momentum</h2>
        <p className="text-muted-foreground mb-2 text-sm">
          Who was ahead, rally by rally.
        </p>
        <MatchMomentum games={scopedGames} p1Name={p1Name} p2Name={p2Name} />
      </section>

      {/* the why */}
      <section className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold">Head-to-head</h2>
        <p className="text-muted-foreground mb-2 text-sm">
          {lensLabel} totals · bold marks the better number.
        </p>
        <H2hBars rows={statRows} />
      </section>

      {/* the receipts, demoted */}
      <section className="flex flex-col gap-4">
        <button
          type="button"
          aria-expanded={logOpen}
          onClick={() => setLogOpen((o) => !o)}
          className="ring-foreground/10 hover:bg-muted/60 flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm ring-1 transition-colors"
        >
          <ListIcon aria-hidden className="text-muted-foreground size-4" />
          <span className="font-medium">Rally log</span>
          <span className="text-muted-foreground ml-auto tabular-nums">
            {allRows.length}
          </span>
          <ChevronDownIcon
            aria-hidden
            className={cn(
              "text-muted-foreground size-4 transition-transform",
              logOpen && "rotate-180",
            )}
          />
        </button>
        {logOpen &&
          folded.map((g, gi) => (
            <section
              key={g.gameId}
              ref={(el) => {
                gameRefs.current[g.gameId] = el
              }}
              className="flex scroll-mt-4 flex-col gap-3"
            >
              <h3 className="font-heading text-base font-bold">
                Game {g.gameNumber}
              </h3>
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
      </section>

      <RallyDetailSheet
        rally={selected === null ? null : allRows[selected]}
        showMatchLink={false}
        onClose={() => setSelected(null)}
        onPrev={() => setSelected((i) => (i === null ? i : Math.max(0, i - 1)))}
        onNext={() =>
          setSelected((i) =>
            i === null ? i : Math.min(allRows.length - 1, i + 1),
          )
        }
        hasPrev={selected !== null && selected > 0}
        hasNext={selected !== null && selected < allRows.length - 1}
      />
    </main>
  )
}
