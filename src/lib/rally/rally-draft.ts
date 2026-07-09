import type {
  EndReason,
  ErrorDetail,
  ServeSide,
  ShotType,
} from "@/lib/schemas/enums"
import type { HouseRules, RallyInput, Suggestion } from "@/lib/scoring"

// The rally-entry state machine (§5.3 Phase B, §8.7 #4). Pure functions over
// a draft object — the components are a thin skin. Auto-rules mirror the DB
// constraints so invalid combinations are unrepresentable in the UI:
//
//   ace         ⇒ the winner served        (server chip corrected to winner)
//   serve_fault ⇒ the receiver won         (server corrected to non-winner)
//                 and, in two-serve matches, it happened on serve 2
//
// The user's winner tap is their primary assertion — when an end reason
// implies who served, we correct the *server suggestion*, never the winner.

export interface RallyDraft {
  serverId: string
  serveSide: ServeSide
  serveNumber: 1 | 2
  winnerId: string | null
  endReason: EndReason | null
  errorDetail: ErrorDetail | null
  forced: boolean | null
  shotType: ShotType | null
  shotCount: number | null
}

export interface DraftContext {
  player1Id: string
  player2Id: string
  rules: HouseRules
}

export function otherPlayer(ctx: DraftContext, playerId: string): string {
  return playerId === ctx.player1Id ? ctx.player2Id : ctx.player1Id
}

export function createDraft(suggestion: Suggestion): RallyDraft {
  return {
    serverId: suggestion.serverId,
    serveSide: suggestion.serveSide,
    serveNumber: suggestion.serveNumber,
    winnerId: null,
    endReason: null,
    errorDetail: null,
    forced: null,
    shotType: null,
    // every rally has at least the serve; clearable to null (= not counted)
    shotCount: 1,
  }
}

export function tapWinner(
  draft: RallyDraft,
  winnerId: string,
  ctx: DraftContext,
): RallyDraft {
  // a winner contradicts a let (DB: let ⇔ null winner) — the newer tap wins
  const next: RallyDraft = {
    ...draft,
    winnerId,
    endReason: draft.endReason === "let" ? null : draft.endReason,
  }
  // a re-tap is a misclick correction: re-apply the chosen end reason so its
  // server corrections (ace/serve_fault) track the new winner
  if (next.endReason) return selectEndReason(next, next.endReason, ctx)
  return applyAutoRules(next)
}

export function selectEndReason(
  draft: RallyDraft,
  endReason: EndReason,
  ctx: DraftContext,
): RallyDraft {
  let next: RallyDraft = { ...draft, endReason }

  if (endReason === "let") {
    // a let has no winner (DB: let ⇔ null winner) — used by the rally editor
    // to convert a mis-logged decided rally back into a let
    next = { ...next, winnerId: null }
  }
  if (endReason === "ace" && next.winnerId) {
    // an ace is by definition served by the winner
    next = { ...next, serverId: next.winnerId }
  }
  if (endReason === "serve_fault" && next.winnerId) {
    // a point-ending fault is by definition lost by the server
    next = { ...next, serverId: otherPlayer(ctx, next.winnerId) }
    if (ctx.rules.servesPerPoint === 2) {
      next = { ...next, serveNumber: 2 }
    }
  }
  return applyAutoRules(next)
}

/** clears fields that don't apply to the current end reason (DB scopes) —
 *  forced is cleared before the shot check, so a reason change that retires
 *  `forced` also retires the shot that depended on it */
function applyAutoRules(draft: RallyDraft): RallyDraft {
  const next = { ...draft }
  if (!showsErrorDetail(next.endReason)) next.errorDetail = null
  if (!showsForced(next.endReason)) next.forced = null
  if (!showsShotType(next.endReason, next.forced)) next.shotType = null
  return next
}

export function showsErrorDetail(endReason: EndReason | null): boolean {
  return endReason === "error" || endReason === "serve_fault"
}

export function showsForced(endReason: EndReason | null): boolean {
  return endReason === "error"
}

/** Setting forced re-runs the auto rules — flipping a forced error back to
 *  unforced retires the shot that depended on it. */
export function setForced(
  draft: RallyDraft,
  forced: boolean | null,
): RallyDraft {
  return applyAutoRules({ ...draft, forced })
}

/** The shot is always the rally WINNER's decisive one — their winner, their
 *  ace, or the shot that forced the error. An unforced error has no decisive
 *  shot by the winner, so it takes none (mirrors rallies_shot_type_scope). */
export function showsShotType(
  endReason: EndReason | null,
  forced: boolean | null,
): boolean {
  if (endReason === "winner" || endReason === "ace") return true
  return endReason === "error" && forced === true
}

/** a point-ending serve fault is lost by the server — if the tapped winner
 *  IS the shown server, it isn't an option (fix the server chip first) */
export function showsServeFault(draft: RallyDraft): boolean {
  return draft.winnerId !== null && draft.winnerId !== draft.serverId
}

export function toggleServeNumber(
  draft: RallyDraft,
  ctx: DraftContext,
): RallyDraft {
  if (ctx.rules.servesPerPoint === 1) return draft
  return { ...draft, serveNumber: draft.serveNumber === 1 ? 2 : 1 }
}

export function toggleServeSide(draft: RallyDraft): RallyDraft {
  return { ...draft, serveSide: draft.serveSide === "left" ? "right" : "left" }
}

export function toggleServer(draft: RallyDraft, ctx: DraftContext): RallyDraft {
  return { ...draft, serverId: otherPlayer(ctx, draft.serverId) }
}

/** a decided rally needs winner + end reason; a let needs neither */
export function canSave(draft: RallyDraft): boolean {
  if (draft.endReason === "let") return draft.winnerId === null
  return draft.winnerId !== null && draft.endReason !== null
}

/** the let path bypasses the chips: no winner, current serve context (§5.3) */
export function buildLet(draft: RallyDraft): RallyInput {
  return {
    serverId: draft.serverId,
    serveSide: draft.serveSide,
    serveNumber: draft.serveNumber,
    winnerId: null,
    endReason: "let",
  }
}

export interface RallyRow {
  id: string
  game_id: string
  rally_number: number
  server_id: string
  serve_side: ServeSide
  serve_number: 1 | 2
  winner_id: string | null
  end_reason: EndReason
  error_detail: ErrorDetail | null
  forced: boolean | null
  shot_type: ShotType | null
  shot_count: number | null
}

export function buildRallyRow(
  draft: RallyDraft,
  meta: { id: string; gameId: string; rallyNumber: number },
): RallyRow {
  if (!canSave(draft)) {
    throw new Error("rally draft is incomplete (winner + end reason required)")
  }
  if (draft.endReason === "let") return buildLetRow(draft, meta)
  return {
    id: meta.id,
    game_id: meta.gameId,
    rally_number: meta.rallyNumber,
    server_id: draft.serverId,
    serve_side: draft.serveSide,
    serve_number: draft.serveNumber,
    winner_id: draft.winnerId,
    end_reason: draft.endReason!,
    error_detail: draft.errorDetail,
    forced: draft.forced,
    shot_type: draft.shotType,
    shot_count: draft.shotCount,
  }
}

export function buildLetRow(
  draft: RallyDraft,
  meta: { id: string; gameId: string; rallyNumber: number },
): RallyRow {
  return {
    id: meta.id,
    game_id: meta.gameId,
    rally_number: meta.rallyNumber,
    server_id: draft.serverId,
    serve_side: draft.serveSide,
    serve_number: draft.serveNumber,
    winner_id: null,
    end_reason: "let",
    error_detail: null,
    forced: null,
    shot_type: null,
    shot_count: null,
  }
}

/** reopen a saved row as a draft — the rally editor's starting state */
export function rowToDraft(row: RallyRow): RallyDraft {
  return {
    serverId: row.server_id,
    serveSide: row.serve_side,
    serveNumber: row.serve_number,
    winnerId: row.winner_id,
    endReason: row.end_reason,
    errorDetail: row.error_detail,
    forced: row.forced,
    shotType: row.shot_type,
    shotCount: row.shot_count,
  }
}

export function rowToRallyInput(row: RallyRow): RallyInput {
  return {
    serverId: row.server_id,
    serveSide: row.serve_side,
    serveNumber: row.serve_number,
    winnerId: row.winner_id,
    endReason: row.end_reason,
  }
}
