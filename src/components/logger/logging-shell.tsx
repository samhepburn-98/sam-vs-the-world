import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useMatchDetail } from "@/lib/queries/get-match-detail"
import { gameResult } from "@/lib/scoring"

import type { GameWithRallies, MatchDetail } from "@/lib/schemas/match"
import type { PlayerSummary } from "@/lib/schemas/player"
import type { RallyInput } from "@/lib/scoring"

// Phase B placeholder: proves the setup → logging handoff and the
// resume-at-derived-state acceptance. The real entry surface (score header,
// winner buttons, chips, timeline) lands with #14–#16 and replaces the body.

function toRallyInputs(game: GameWithRallies): Array<RallyInput> {
  return game.rallies.map((r) => ({
    serverId: r.server_id,
    serveSide: r.serve_side,
    serveNumber: r.serve_number === 2 ? 2 : 1,
    winnerId: r.winner_id,
    endReason: r.end_reason,
  }))
}

interface LoggingShellProps {
  matchId: string
  players: Array<PlayerSummary>
  onExit: () => void
}

export function LoggingShell({ matchId, players, onExit }: LoggingShellProps) {
  const detail = useMatchDetail(matchId)

  if (detail.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }
  if (detail.isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-destructive text-sm">Couldn't load the match.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void detail.refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  return <ShellBody match={detail.data} players={players} onExit={onExit} />
}

function ShellBody({
  match,
  players,
  onExit,
}: {
  match: MatchDetail
  players: Array<PlayerSummary>
  onExit: () => void
}) {
  const nameOf = (id: string | null) =>
    players.find((p) => p.id === id)?.name ?? "—"
  const ctx = { player1Id: match.player1_id, player2Id: match.player2_id }
  const games = match.games.map((g) => ({
    game: g,
    result: gameResult(toRallyInputs(g), ctx),
  }))
  const current = games.length > 0 ? games[games.length - 1] : undefined

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {nameOf(match.player1_id)} vs {nameOf(match.player2_id)}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {match.date} · {match.format ? `best of ${match.format}` : "casual"}{" "}
            · to {match.target_score} (
            {match.tiebreak === "win_by_2" ? "win by 2" : "sudden death"}) ·{" "}
            {match.serves_per_point === 2 ? "two serves" : "single serve"}
            {match.ball_type ? ` · ${match.ball_type.replace("_", " ")} ball` : ""}
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onExit}>
          Pause & exit
        </Button>
      </header>

      {current && (
        <section className="text-center">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            Game {current.game.game_number}
          </p>
          <p className="mt-2 text-6xl font-bold tabular-nums">
            {current.result.score.p1}
            <span className="text-muted-foreground mx-3">–</span>
            {current.result.score.p2}
          </p>
        </section>
      )}

      {games.length > 1 && (
        <ul className="text-muted-foreground flex justify-center gap-3 text-sm tabular-nums">
          {games.slice(0, -1).map(({ game, result }) => (
            <li key={game.id} className="rounded-md border px-2.5 py-1">
              G{game.game_number}: {result.score.p1}–{result.score.p2}
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground border-t pt-6 text-center text-sm">
        Rally entry — the big buttons, outcome chips, and timeline — lands with
        the next issues (#14–#16).
      </p>
    </div>
  )
}
