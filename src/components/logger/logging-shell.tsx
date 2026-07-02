import { useRef, useState } from "react"

import { OutcomeChips } from "@/components/logger/outcome-chips"
import { ScoreHeader } from "@/components/logger/score-header"
import { SyncIndicator } from "@/components/logger/sync-indicator"
import { WinnerButtons } from "@/components/logger/winner-buttons"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  buildLetRow,
  buildRallyRow,
  createDraft,
  rowToRallyInput,
  selectEndReason,
  tapWinner,
  toggleServeNumber,
  toggleServeSide,
  toggleServer,
} from "@/lib/logger/rally-draft"
import { insertRallyOp } from "@/lib/queries/create-rally"
import { useMatchDetail } from "@/lib/queries/get-match-detail"
import { gameResult, scoreAfter, suggestNext } from "@/lib/scoring"

import type { DraftContext, RallyRow } from "@/lib/logger/rally-draft"
import type { MatchDetail } from "@/lib/schemas/match"
import type { PlayerSummary } from "@/lib/schemas/player"
import type { WriteQueue } from "@/lib/queue/write-queue"
import type { GameContext, HouseRules } from "@/lib/scoring"

// Phase B (§5.3): score header, winner buttons, outcome chips. The rally
// timeline (#15), undo (#16), game-over banner (#16), and hotkeys (#17)
// layer onto this surface.

interface LoggingShellProps {
  matchId: string
  players: Array<PlayerSummary>
  queue: WriteQueue
  /** known for fresh matches; resumed matches recover it from rally 1 */
  firstServerId?: string
  onExit: () => void
}

export function LoggingShell({
  matchId,
  players,
  queue,
  firstServerId,
  onExit,
}: LoggingShellProps) {
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

  const match = detail.data
  const currentGame = match.games.at(-1)
  if (!currentGame) {
    return (
      <p className="text-destructive py-16 text-center text-sm">
        This match has no games — reopen it after checking /manage.
      </p>
    )
  }

  return (
    <ActiveGameLogger
      key={currentGame.id}
      match={match}
      gameId={currentGame.id}
      gameNumber={currentGame.game_number}
      initialRows={currentGame.rallies.map(normalizeRow)}
      players={players}
      queue={queue}
      firstServerId={firstServerId}
      onExit={onExit}
    />
  )
}

function normalizeRow(r: {
  id: string
  game_id: string
  rally_number: number
  server_id: string
  serve_side: "left" | "right"
  serve_number: number
  winner_id: string | null
  end_reason: RallyRow["end_reason"]
  error_detail: RallyRow["error_detail"]
  forced: boolean | null
  shot_type: RallyRow["shot_type"]
  shot_count: number | null
}): RallyRow {
  return { ...r, serve_number: r.serve_number === 2 ? 2 : 1 }
}

function rulesOf(match: MatchDetail): HouseRules {
  return {
    targetScore: match.target_score,
    tiebreak: match.tiebreak,
    servesPerPoint: match.serves_per_point === 1 ? 1 : 2,
    letResetsServe: match.let_resets_serve,
  }
}

interface ActiveGameLoggerProps {
  match: MatchDetail
  gameId: string
  gameNumber: number
  initialRows: Array<RallyRow>
  players: Array<PlayerSummary>
  queue: WriteQueue
  firstServerId?: string
  onExit: () => void
}

function ActiveGameLogger({
  match,
  gameId,
  gameNumber,
  initialRows,
  players,
  queue,
  firstServerId,
  onExit,
}: ActiveGameLoggerProps) {
  const rules = rulesOf(match)
  const gameCtx: GameContext = {
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    // durable record is rally 1's server; fall back to the setup choice,
    // then player 1 (tappable chip corrects it either way)
    firstServerId:
      initialRows.at(0)?.server_id ?? firstServerId ?? match.player1_id,
    rules,
  }
  const draftCtx: DraftContext = {
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    rules,
  }

  const [rows, setRows] = useState(initialRows)
  const [draft, setDraft] = useState(() =>
    createDraft(suggestNext(initialRows.map(rowToRallyInput), gameCtx)),
  )
  const winnerRef = useRef<HTMLDivElement>(null)

  const inputs = rows.map(rowToRallyInput)
  const score = scoreAfter(inputs, gameCtx)
  const nameOf = (id: string | null) =>
    players.find((p) => p.id === id)?.name ?? "—"

  function commitRow(row: RallyRow) {
    const nextRows = [...rows, row]
    setRows(nextRows)
    queue.enqueue(insertRallyOp(row))
    setDraft(createDraft(suggestNext(nextRows.map(rowToRallyInput), gameCtx)))
    winnerRef.current?.focus()
  }

  const rulesLine = [
    match.format ? `best of ${match.format}` : "casual",
    `to ${match.target_score}`,
    rules.servesPerPoint === 2 ? "two serves" : "single serve",
  ].join(" · ")

  const priorGames = match.games
    .filter((g) => g.id !== gameId)
    .map((g) => ({
      n: g.game_number,
      r: gameResult(g.rallies.map(normalizeRow).map(rowToRallyInput), gameCtx),
    }))

  const lastRow = rows.at(-1)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {nameOf(match.player1_id)} vs {nameOf(match.player2_id)} ·{" "}
          {match.date}
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={onExit}>
          Pause & exit
        </Button>
      </header>

      <ScoreHeader
        p1Name={nameOf(match.player1_id)}
        p2Name={nameOf(match.player2_id)}
        p1Id={match.player1_id}
        score={score}
        gameNumber={gameNumber}
        rulesLine={rulesLine}
        draft={draft}
        servesPerPoint={rules.servesPerPoint}
        onToggleServer={() => setDraft((d) => toggleServer(d, draftCtx))}
        onToggleSide={() => setDraft((d) => toggleServeSide(d))}
        onToggleServeNumber={() =>
          setDraft((d) => toggleServeNumber(d, draftCtx))
        }
      />

      <WinnerButtons
        ref={winnerRef}
        p1Name={nameOf(match.player1_id)}
        p2Name={nameOf(match.player2_id)}
        onWinner={(side) =>
          setDraft((d) =>
            tapWinner(
              d,
              side === "p1" ? match.player1_id : match.player2_id,
            ),
          )
        }
        onLet={() => {
          commitRow(
            buildLetRow(draft, {
              id: crypto.randomUUID(),
              gameId,
              rallyNumber: rows.length + 1,
            }),
          )
        }}
      />

      {draft.winnerId !== null && (
        <OutcomeChips
          draft={draft}
          winnerName={nameOf(draft.winnerId)}
          onEndReason={(r) => setDraft((d) => selectEndReason(d, r, draftCtx))}
          onErrorDetail={(v) => setDraft((d) => ({ ...d, errorDetail: v }))}
          onForced={(v) => setDraft((d) => ({ ...d, forced: v }))}
          onShotType={(v) => setDraft((d) => ({ ...d, shotType: v }))}
          onShotCount={(v) => setDraft((d) => ({ ...d, shotCount: v }))}
          onSave={() => {
            commitRow(
              buildRallyRow(draft, {
                id: crypto.randomUUID(),
                gameId,
                rallyNumber: rows.length + 1,
              }),
            )
          }}
          onCancel={() =>
            setDraft(createDraft(suggestNext(inputs, gameCtx)))
          }
        />
      )}

      <footer className="flex flex-col gap-2">
        {lastRow && (
          <p className="text-muted-foreground text-center text-xs">
            Last: {lastRow.rally_number}.{" "}
            {lastRow.end_reason === "let"
              ? "let (replayed)"
              : `${nameOf(lastRow.winner_id)} — ${lastRow.end_reason.replace("_", " ")}`}
            {lastRow.error_detail ? ` (${lastRow.error_detail.replace("_", " ")})` : ""}
            {" · "}
            {rows.length} rall{rows.length === 1 ? "y" : "ies"} this game
          </p>
        )}
        {priorGames.length > 0 && (
          <ul className="text-muted-foreground flex justify-center gap-3 text-xs tabular-nums">
            {priorGames.map(({ n, r }) => (
              <li key={n} className="rounded-md border px-2 py-0.5">
                G{n}: {r.score.p1}–{r.score.p2}
              </li>
            ))}
          </ul>
        )}
        <SyncIndicator queue={queue} />
      </footer>
    </div>
  )
}
