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
  rallies_winning_shot_scope:
    "A winning shot only applies to winners and forced errors.",
  rallies_losing_shot_scope: "A losing shot only applies to errors.",
  rallies_winning_shot_current:
    "That shot type was retired — use drive, boast, or drop.",
  rallies_losing_shot_current:
    "That shot type was retired — use drive, boast, or drop.",
  rallies_end_reason_current:
    "Ace was retired — log it as a winner with rally length 1.",
  rallies_fault_receiver_wins: "A serve fault is lost by the server.",
  rallies_game_number_uniq: "That rally number is already taken in this game.",
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

export function friendlyWriteError(
  error: unknown,
  fallback = "The save failed — check your connection and try again."
): string {
  const e = error as {
    message?: string
    details?: string
    code?: string
  } | null
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
  // A Postgres rejection carries a SQLSTATE, and its message is a sentence
  // worth showing — that's how trigger raise_exception (P0001) text reaches
  // the user. A transport failure carries no code: supabase-js resolves a
  // dropped connection into a plain object whose message is the raw
  // "TypeError: Failed to fetch", and a 5xx gateway page arrives as an HTML
  // body. Neither belongs on screen, so those get the sentence instead.
  return e?.code ? (e.message ?? fallback) : fallback
}
