import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type {
  DecisiveShots,
  ErrorProfile,
  Momentum,
  PlayerHeadline,
  RallyLengths,
  ServeStats,
} from "@/features/dashboard/schemas/insights"

// Builders for a plausible PlayerData payload, shared by the attribute and
// scoring tests. Each takes overrides so a test states only what it varies.

export const serve = (over: Partial<ServeStats> = {}): ServeStats => ({
  rallies_served: 100,
  serve_wins: 58,
  rallies_returned: 100,
  return_wins: 47,
  aces: 6,
  double_faults: 2,
  two_serve_rallies_served: 0,
  first_serve_faults: 0,
  serve1_served: 0,
  serve1_wins: 0,
  serve2_served: 0,
  serve2_wins: 0,
  left_served: 50,
  left_wins: 30,
  right_served: 50,
  right_wins: 28,
  ...over,
})

export const rally = (over: Partial<RallyLengths> = {}): RallyLengths => ({
  total_rallies: 200,
  avg_length: 8.42,
  longest: 34,
  short_rallies: 80,
  short_wins: 35,
  medium_rallies: 80,
  medium_wins: 40,
  long_rallies: 40,
  long_wins: 25,
  ...over,
})

export const error = (over: Partial<ErrorProfile> = {}): ErrorProfile => ({
  errors_total: 60,
  forced_errors: 33,
  unforced_errors: 22,
  untagged_errors: 5,
  tin: 20,
  out_top: 10,
  out_side: 8,
  out_back: 6,
  not_up: 10,
  detail_untagged: 6,
  games_played: 12,
  trend: [],
  ...over,
})

export const momentum = (over: Partial<Momentum> = {}): Momentum => ({
  comebacks: 3,
  longest_streak: 6,
  longest_streak_game_id: null,
  early_rallies: 100,
  early_wins: 52,
  mid_rallies: 80,
  mid_wins: 40,
  close_rallies: 50,
  close_wins: 32,
  comeback_games: [],
  ...over,
})

export const headline = (
  over: Partial<PlayerHeadline> = {}
): PlayerHeadline => ({
  player_id: "00000000-0000-0000-0000-000000000001",
  games_won: 24,
  games_decided: 40,
  matches_won: 7,
  matches_decided: 12,
  signature_trait: "grinder",
  clean_finish_wins: 45,
  points_won: 100,
  recent_games: [],
  ...over,
})

export const decisive = (over: Partial<DecisiveShots> = {}): DecisiveShots => ({
  winning_drive: 9,
  winning_drop: 2,
  winning_boast: 1,
  losing_drive: 4,
  losing_drop: 4,
  losing_boast: 0,
  ...over,
})

export const player = (over: Partial<PlayerData> = {}): PlayerData => ({
  headline: headline(),
  serve: serve(),
  error: error(),
  rally: rally(),
  momentum: momentum(),
  decisive: decisive(),
  ...over,
})
