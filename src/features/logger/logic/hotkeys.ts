import type { EndReason, ErrorDetail } from "@/lib/schemas/enums"

// The §5.3 hotkey map, as data + a pure resolver. s/d pick the winner by
// SCREEN SIDE (court positions, not initials — generalises to any opponent).
// The shell decides what an action means given the current draft; this module
// only says what key means what. Keys are inert while typing (isEditableTarget).

export type HotkeyAction =
  | { type: "winner"; side: "p1" | "p2" }
  | { type: "let" }
  | { type: "endReason"; reason: Exclude<EndReason, "let"> }
  | { type: "errorDetail"; detail: ErrorDetail }
  | { type: "toggleForced" }
  | { type: "toggleServeNumber" }
  | { type: "toggleServeSide" }
  | { type: "digit"; digit: number }
  | { type: "save" }
  | { type: "undo" }
  | { type: "help" }

const END_REASON_KEYS: Record<string, Exclude<EndReason, "let" | "ace">> = {
  w: "winner",
  e: "error",
  k: "stroke",
  f: "serve_fault",
}

const ERROR_DETAIL_KEYS: Record<string, ErrorDetail> = {
  t: "tin",
  o: "out_top",
  i: "out_side",
  b: "out_back",
  n: "not_up",
}

/** true when the event target is something the user types into */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable === true
  )
}

export function hotkeyAction(
  e: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey">,
): HotkeyAction | null {
  if (e.altKey) return null
  if (e.metaKey || e.ctrlKey) {
    // cmd+z / ctrl+z — everything else stays the browser's
    return e.key.toLowerCase() === "z" ? { type: "undo" } : null
  }

  if (e.key === "?") return { type: "help" }
  if (e.key === "Enter") return { type: "save" }
  if (/^[0-9]$/.test(e.key)) return { type: "digit", digit: Number(e.key) }

  const key = e.key.toLowerCase()
  if (key === "s") return { type: "winner", side: "p1" }
  if (key === "d") return { type: "winner", side: "p2" }
  if (key === "l") return { type: "let" }
  if (key === "g") return { type: "toggleForced" }
  if (key === "q") return { type: "toggleServeNumber" }
  if (key === "z") return { type: "toggleServeSide" }
  if (key === "u") return { type: "undo" }
  if (key in END_REASON_KEYS) {
    return { type: "endReason", reason: END_REASON_KEYS[key] }
  }
  if (key in ERROR_DETAIL_KEYS) {
    return { type: "errorDetail", detail: ERROR_DETAIL_KEYS[key] }
  }
  return null
}

/** key hints for controls and the cheat sheet — single source with the map */
export const HOTKEY_HINTS = {
  winnerP1: "s",
  winnerP2: "d",
  let: "l",
  endReason: { winner: "w", error: "e", stroke: "k", serve_fault: "f" },
  errorDetail: {
    tin: "t",
    out_top: "o",
    out_side: "i",
    out_back: "b",
    not_up: "n",
  },
  forced: "g",
  serveNumber: "q",
  serveSide: "z",
  save: "↵",
  undo: "u",
  help: "?",
} as const
