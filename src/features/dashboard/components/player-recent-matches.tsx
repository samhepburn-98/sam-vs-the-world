import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"

import { matchesQueryOptions } from "@/features/dashboard/api/get-matches"
import { BallDots } from "@/components/ball-dots"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlayers } from "@/lib/api/get-players"
import { cn } from "@/lib/utils"

// The player's own recent matches on the profile (§5.1) — the most "profile"
// thing there is. Newest first, from `match_results` filtered to this player;
// each row drills to the full match.

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export function PlayerRecentMatches({
  playerId,
  limit = 5,
}: {
  playerId: string
  limit?: number
}) {
  const matches = useQuery(matchesQueryOptions({ player: playerId, page: 1 }))
  const players = usePlayers()

  if (!matches.data || !players.data) {
    return <Skeleton className="h-40 w-full rounded-2xl" />
  }
  const rows = matches.data.rows.slice(0, limit)
  if (rows.length === 0) return null

  const nameOf = (id: string) =>
    players.data.find((p) => p.id === id)?.name ?? "Unknown"

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold">Recent matches</h2>
        <Link
          to="/matches"
          search={{ page: 1 }}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          View all
        </Link>
      </div>
      <ul className="flex flex-col divide-y">
        {rows.map((m) => {
          const isP1 = m.player1_id === playerId
          const opponentId = isP1 ? m.player2_id : m.player1_id
          const mine = isP1 ? m.games_won_p1 : m.games_won_p2
          const theirs = isP1 ? m.games_won_p2 : m.games_won_p1
          const hasScore = mine !== null && theirs !== null
          const result =
            m.match_winner_id === null
              ? null
              : m.match_winner_id === playerId
                ? "won"
                : "lost"
          return (
            <li key={m.match_id}>
              <Link
                to="/matches/$matchId"
                params={{ matchId: m.match_id }}
                className="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5"
              >
                <span className="text-muted-foreground w-24 shrink-0 text-sm tabular-nums">
                  {formatDate(m.date)}
                </span>
                <span className="flex-1 truncate text-sm">
                  <span className="text-muted-foreground">vs</span>{" "}
                  {nameOf(opponentId)}
                </span>
                {hasScore && (
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {mine}–{theirs}
                  </span>
                )}
                {result && (
                  <span
                    className={cn(
                      "w-10 shrink-0 text-right text-xs font-medium",
                      result === "won" ? "text-emerald-500" : "text-red-500",
                    )}
                  >
                    {result === "won" ? "Won" : "Lost"}
                  </span>
                )}
                {m.ball_type && <BallDots ball={m.ball_type} />}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
