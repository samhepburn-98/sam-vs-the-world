// DB constraint violations, translated for the manage edit forms: the
// constraint IS the validation, so its rejection
// deserves a sentence, not a Postgres identifier. Trigger messages (e.g.
// "server_id … is not a player in this match") are already sentences and
// pass through as-is.

const CONSTRAINT_MESSAGES: Record<string, string> = {
  rallies_let_null_winner:
    "A let has no winner — every other end reason needs one.",
  rallies_error_detail_scope:
    "Error detail only applies to errors and serve faults.",
  rallies_forced_scope: "Forced/unforced only applies to errors.",
  rallies_shot_type_scope: "Shot type only applies to winners and aces.",
  rallies_ace_winner_serves: "An ace is served by its winner.",
  rallies_fault_receiver_wins: "A serve fault is lost by the server.",
  rallies_game_number_uniq:
    "That rally number is already taken in this game.",
  games_match_number_uniq: "That game number already exists in this match.",
  matches_distinct_players: "A match needs two different players.",
  matches_format_check: "Best-of must be an odd number between 1 and 9.",
  players_name_check: "Give the player a non-empty name.",
}

// Storage API failures phrase things differently from Postgres — no
// constraint names, no SQLSTATE codes — so avatar uploads get their own
// message-substring translations (the bucket's server-side limits).
const STORAGE_MESSAGES: Array<[string, string]> = [
  [
    "exceeded the maximum allowed size",
    "That photo is too large — try a smaller one.",
  ],
  ["Payload too large", "That photo is too large — try a smaller one."],
  ["mime type", "That file type isn't supported — use a JPEG or PNG."],
  [
    "row-level security",
    "You don't have permission to change this — sign in as the owner.",
  ],
]

export function friendlyWriteError(error: unknown): string {
  const e = error as { message?: string; details?: string; code?: string } | null
  const haystack = `${e?.message ?? ""} ${e?.details ?? ""}`

  for (const [constraint, message] of Object.entries(CONSTRAINT_MESSAGES)) {
    if (haystack.includes(constraint)) return message
  }
  for (const [needle, message] of STORAGE_MESSAGES) {
    if (haystack.toLowerCase().includes(needle.toLowerCase())) return message
  }
  if (e?.code === "42501") {
    return "You don't have permission to change this — sign in as the owner."
  }
  // trigger raise_exception (P0001) and anything else: the message is best
  return e?.message ?? "The save failed — check your connection and try again."
}
