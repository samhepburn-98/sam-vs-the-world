import { useEffect, useRef, useState } from "react"

import { GameOverBanner } from "@/features/logger/components/game-over-banner"
import { Glossary } from "@/features/logger/components/glossary"
import { HotkeyHelp } from "@/features/logger/components/hotkey-help"
import { MatchSummary } from "@/features/logger/components/match-summary"
import { OutcomeChips } from "@/features/logger/components/outcome-chips"
import { RallyEditor } from "@/components/rally/rally-editor"
import { RallyTimeline } from "@/features/logger/components/rally-timeline"
import { ScoreHeader } from "@/features/logger/components/score-header"
import { SyncIndicator } from "@/features/logger/components/sync-indicator"
import { UndoBar } from "@/features/logger/components/undo-bar"
import { WinnerButtons } from "@/features/logger/components/winner-buttons"
import { Button } from "@/components/ui/button"
import { KbdHintsContext } from "@/components/ui/kbd"
import { Spinner } from "@/components/ui/spinner"
import { hotkeyAction, isEditableTarget } from "@/features/logger/logic/hotkeys"
import {
  buildLetRow,
  buildRallyRow,
  canSave,
  createDraft,
  rowToRallyInput,
  selectEndReason,
  setForced,
  showsErrorDetail,
  showsForced,
  showsServeFault,
  tapWinner,
  toggleServeNumber,
  toggleServeSide,
  toggleServer,
} from "@/lib/rally/rally-draft"
import {
  currentGame,
  editRally,
  redo,
  saveRally,
  startGame,
  undo,
} from "@/features/logger/logic/session"
import { useMatchDetail } from "@/lib/api/get-match-detail"
import { intentToOp } from "@/lib/api/session-ops"
import { useMediaQuery } from "@/lib/use-media-query"
import {
  gameOver,
  gameResult,
  suggestNext,
  suggestNextGameFirstServer,
  tallyMatch,
} from "@/lib/scoring"

import type { HotkeyAction } from "@/features/logger/logic/hotkeys"
import type { DraftContext, RallyRow } from "@/lib/rally/rally-draft"
import type { SessionState, Transition } from "@/features/logger/logic/session"
import type { MatchDetail } from "@/lib/schemas/match"
import type { PlayerSummary } from "@/lib/schemas/player"
import type { WriteQueue } from "@/lib/api/write-queue"
import type { GameContext, HouseRules } from "@/lib/scoring"

// The logging surface (§5.3): score header, winner buttons, outcome chips,
// editable timeline, one-action undo, game/match end flow. Hotkeys (#17)
// layer onto this surface. All session mutations run through the pure
// planner in lib/logger/session — this component maps its write intents
// onto the FIFO queue and renders the result.

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

  if (detail.data.games.length === 0) {
    return (
      <p className="text-destructive py-16 text-center text-sm">
        This match has no games — reopen it after checking /manage.
      </p>
    )
  }

  return (
    <MatchLogger
      key={matchId}
      match={detail.data}
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
  winning_shot: RallyRow["winning_shot"]
  losing_shot: RallyRow["losing_shot"]
  shot_count: number | null
}): RallyRow {
  return { ...r, serve_number: r.serve_number === 2 ? 2 : 1 }
}

const HINTS_PREF_KEY = "svw:show-key-hints"

function rulesOf(match: MatchDetail): HouseRules {
  return {
    targetScore: match.target_score,
    tiebreak: match.tiebreak,
    servesPerPoint: match.serves_per_point === 1 ? 1 : 2,
    letResetsServe: match.let_resets_serve,
  }
}

interface MatchLoggerProps {
  match: MatchDetail
  players: Array<PlayerSummary>
  queue: WriteQueue
  firstServerId?: string
  onExit: () => void
}

function MatchLogger({
  match,
  players,
  queue,
  firstServerId,
  onExit,
}: MatchLoggerProps) {
  const rules = rulesOf(match)

  const [session, setSession] = useState<SessionState>(() => ({
    matchId: match.id,
    games: match.games.map((g) => ({
      id: g.id,
      gameNumber: g.game_number,
      rows: g.rallies.map(normalizeRow),
    })),
    undoable: null,
    redoable: null,
  }))
  // null = "follow the engine's suggestion"; transitions reset by nulling
  const [draftState, setDraftState] = useState<ReturnType<
    typeof createDraft
  > | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const [showHints, setShowHints] = useState(
    () =>
      typeof window === "undefined" ||
      window.localStorage.getItem(HINTS_PREF_KEY) !== "0",
  )
  // hotkeys need a physical keyboard, so the keycap hints are dead weight on a
  // phone — hide them below tablet width, whatever the stored preference (§10)
  const hintsWide = useMediaQuery("(min-width: 768px)", true)
  const winnerRef = useRef<HTMLDivElement>(null)
  // digits replace the suggested shot count first, then append (1 → "12" ✓)
  const digitTyped = useRef(false)

  const game = currentGame(session)
  const nameOf = (id: string | null) =>
    players.find((p) => p.id === id)?.name ?? "—"

  // who serves this game's first rally: the stored fact (rally 1), else the
  // setup choice for game 1, else the previous game's winner (§7.2)
  const matchFirstServer =
    session.games[0].rows.at(0)?.server_id ?? firstServerId ?? match.player1_id
  const baseCtx: GameContext = {
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    firstServerId: matchFirstServer,
    rules,
  }
  const priorGames = session.games.slice(0, -1).map((g) => ({
    n: g.gameNumber,
    r: gameResult(g.rows.map(rowToRallyInput), baseCtx),
  }))
  const gameCtx: GameContext = {
    ...baseCtx,
    firstServerId:
      game.rows.at(0)?.server_id ??
      (game.gameNumber === 1
        ? matchFirstServer
        : suggestNextGameFirstServer(
            priorGames.at(-1)?.r.winnerId ?? null,
            baseCtx,
          )),
  }
  const draftCtx: DraftContext = {
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    rules,
  }

  const inputs = game.rows.map(rowToRallyInput)
  const result = gameResult(inputs, gameCtx)
  const score = result.score
  const draft = draftState ?? createDraft(suggestNext(inputs, gameCtx))

  const over = gameOver(score, rules)
  const tally = tallyMatch(
    [...priorGames.map((g) => g.r), result],
    { player1Id: match.player1_id, player2Id: match.player2_id, format: match.format },
  )
  const matchWinnerName =
    match.format !== null && tally.matchWinnerId !== null
      ? nameOf(tally.matchWinnerId)
      : undefined

  function apply(t: Transition) {
    setSession(t.state)
    for (const intent of t.writes) queue.enqueue(intentToOp(intent))
    setDraftState(null)
    setEditingId(null)
    digitTyped.current = false
  }

  function commitRow(row: RallyRow) {
    apply(saveRally(session, row))
    winnerRef.current?.focus()
  }

  function commitEdit(edited: RallyRow) {
    const midEntry = draft.winnerId !== null || draft.endReason !== null
    const t = editRally(session, edited)
    setSession(t.state)
    for (const intent of t.writes) queue.enqueue(intentToOp(intent))
    setEditingId(null)
    // an edit can change who serves next — refresh an untouched draft only,
    // never clobber a rally mid-entry
    if (!midEntry) setDraftState(null)
  }

  function toggleHints(visible: boolean) {
    setShowHints(visible)
    window.localStorage.setItem(HINTS_PREF_KEY, visible ? "1" : "0")
  }

  function pickWinner(side: "p1" | "p2") {
    digitTyped.current = false
    setDraftState(
      tapWinner(
        draft,
        side === "p1" ? match.player1_id : match.player2_id,
        draftCtx,
      ),
    )
  }

  function saveDraftRally() {
    commitRow(
      buildRallyRow(draft, {
        id: crypto.randomUUID(),
        gameId: game.id,
        rallyNumber: game.rows.length + 1,
      }),
    )
  }

  function saveLet() {
    commitRow(
      buildLetRow(draft, {
        id: crypto.randomUUID(),
        gameId: game.id,
        rallyNumber: game.rows.length + 1,
      }),
    )
  }

  function dispatchHotkey(action: HotkeyAction) {
    const chipsOpen = draft.winnerId !== null
    switch (action.type) {
      case "help":
        setHelpOpen((open) => !open)
        return
      case "winner":
        pickWinner(action.side)
        return
      case "let":
        saveLet()
        return
      case "endReason":
        if (chipsOpen) {
          // f is inert when the tapped winner is the shown server — a serve
          // fault can't win the server the point
          if (action.reason === "serve_fault" && !showsServeFault(draft)) return
          digitTyped.current = false
          setDraftState(selectEndReason(draft, action.reason, draftCtx))
        }
        return
      case "errorDetail":
        if (chipsOpen && showsErrorDetail(draft.endReason)) {
          setDraftState({
            ...draft,
            errorDetail:
              draft.errorDetail === action.detail ? null : action.detail,
          })
        }
        return
      case "toggleForced":
        if (chipsOpen && showsForced(draft.endReason)) {
          setDraftState({ ...draft, forced: draft.forced !== true })
        }
        return
      case "toggleServeNumber":
        setDraftState(toggleServeNumber(draft, draftCtx))
        return
      case "toggleServeSide":
        setDraftState(toggleServeSide(draft))
        return
      case "digit":
        if (chipsOpen) {
          const appended = (draft.shotCount ?? 0) * 10 + action.digit
          setDraftState({
            ...draft,
            shotCount: digitTyped.current ? Math.min(appended, 999) : action.digit,
          })
          digitTyped.current = true
        }
        return
      case "save":
        if (chipsOpen && canSave(draft)) saveDraftRally()
        return
      case "undo":
        apply(undo(session))
        return
    }
  }

  // window-level so no control needs focus; re-bound each render to see
  // fresh state (§5.3 keyboard-first)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (finished || isEditableTarget(e.target)) return
      if (e.key === "Escape") {
        if (glossaryOpen) setGlossaryOpen(false)
        else if (helpOpen) setHelpOpen(false)
        else if (editingId !== null) setEditingId(null)
        return
      }
      if (editingId !== null) return // inline editor owns the keyboard
      const action = hotkeyAction(e)
      if (!action) return
      if (glossaryOpen) return // reading, not logging
      if (helpOpen && action.type !== "help") return
      e.preventDefault()
      dispatchHotkey(action)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  const undoLabel =
    session.undoable === null
      ? null
      : session.undoable.kind === "rally"
        ? `Undo rally ${session.undoable.row.rally_number}`
        : `Undo game ${session.undoable.game.gameNumber}`
  const redoLabel =
    session.redoable === null
      ? null
      : session.redoable.kind === "rally"
        ? `Redo rally ${session.redoable.row.rally_number}`
        : `Redo game ${session.redoable.game.gameNumber}`

  const rulesLine = [
    match.format ? `best of ${match.format}` : "casual",
    `to ${match.target_score}`,
    rules.servesPerPoint === 2 ? "two serves" : "single serve",
  ].join(" · ")

  if (finished) {
    const decided = [...priorGames, { n: game.gameNumber, r: result }].filter(
      ({ r }) => r.score.p1 > 0 || r.score.p2 > 0,
    )
    return (
      <div className="flex flex-col gap-4">
        <MatchSummary
          matchId={match.id}
          headline={
            tally.matchWinnerId
              ? `${nameOf(tally.matchWinnerId)} wins ${tally.gamesWonP1}–${tally.gamesWonP2}`
              : `Session logged — games ${tally.gamesWonP1}–${tally.gamesWonP2}`
          }
          subline={`${nameOf(match.player1_id)} vs ${nameOf(match.player2_id)} · ${match.date} · ${rulesLine}`}
          games={decided.map(({ n, r }) => ({
            gameNumber: n,
            scoreline: `${r.score.p1}–${r.score.p2}`,
            winnerName: r.winnerId ? nameOf(r.winnerId) : null,
          }))}
          onDone={onExit}
        />
        <SyncIndicator queue={queue} />
      </div>
    )
  }

  return (
    <KbdHintsContext.Provider value={showHints && hintsWide}>
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {nameOf(match.player1_id)} vs {nameOf(match.player2_id)} ·{" "}
          {match.date}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setHelpOpen(true)}
          >
            ? Hotkeys
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onExit}>
            Pause & exit
          </Button>
        </div>
      </header>

      <HotkeyHelp
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        hintsVisible={showHints}
        onToggleHints={toggleHints}
      />
      <Glossary open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />

      <ScoreHeader
        p1Name={nameOf(match.player1_id)}
        p2Name={nameOf(match.player2_id)}
        p1Id={match.player1_id}
        score={score}
        gameNumber={game.gameNumber}
        rulesLine={rulesLine}
        draft={draft}
        servesPerPoint={rules.servesPerPoint}
        onToggleServer={() => setDraftState(toggleServer(draft, draftCtx))}
        onToggleSide={() => setDraftState(toggleServeSide(draft))}
        onToggleServeNumber={() =>
          setDraftState(toggleServeNumber(draft, draftCtx))
        }
      />

      {over.over && (
        <GameOverBanner
          gameNumber={game.gameNumber}
          gameWinnerName={nameOf(
            over.leader === "p1" ? match.player1_id : match.player2_id,
          )}
          scoreline={`${score.p1}–${score.p2}`}
          matchWinnerName={matchWinnerName}
          onStartNextGame={() =>
            apply(startGame(session, crypto.randomUUID()))
          }
          onFinishMatch={() => setFinished(true)}
        />
      )}

      <WinnerButtons
        ref={winnerRef}
        p1Name={nameOf(match.player1_id)}
        p2Name={nameOf(match.player2_id)}
        selected={
          draft.winnerId === null
            ? null
            : draft.winnerId === match.player1_id
              ? "p1"
              : "p2"
        }
        onWinner={pickWinner}
        onLet={saveLet}
      />

      {draft.winnerId !== null && (
        <OutcomeChips
          draft={draft}
          winnerName={nameOf(draft.winnerId)}
          loserName={nameOf(
            draft.winnerId === match.player1_id
              ? match.player2_id
              : match.player1_id,
          )}
          onEndReason={(r) => setDraftState(selectEndReason(draft, r, draftCtx))}
          onErrorDetail={(v) => setDraftState({ ...draft, errorDetail: v })}
          onForced={(v) => setDraftState(setForced(draft, v))}
          onShotType={(v) => setDraftState({ ...draft, shotType: v })}
          onShotCount={(v) => setDraftState({ ...draft, shotCount: v })}
          onSave={saveDraftRally}
          onCancel={() => setDraftState(null)}
          onOpenGlossary={() => setGlossaryOpen(true)}
        />
      )}

      <UndoBar
        undoLabel={undoLabel}
        redoLabel={redoLabel}
        onUndo={() => apply(undo(session))}
        onRedo={() => apply(redo(session, crypto.randomUUID()))}
      />

      <RallyTimeline
        rows={game.rows}
        p1Id={match.player1_id}
        p1Name={nameOf(match.player1_id)}
        p2Name={nameOf(match.player2_id)}
        servesPerPoint={rules.servesPerPoint}
        editable
        editingId={editingId}
        onRowClick={(row) => setEditingId(row.id)}
        renderEditor={(row) => (
          <RallyEditor
            row={row}
            ctx={draftCtx}
            p1Name={nameOf(match.player1_id)}
            p2Name={nameOf(match.player2_id)}
            onSave={commitEdit}
            onCancel={() => setEditingId(null)}
          />
        )}
      />

      <footer className="flex flex-col gap-2">
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
    </KbdHintsContext.Provider>
  )
}
