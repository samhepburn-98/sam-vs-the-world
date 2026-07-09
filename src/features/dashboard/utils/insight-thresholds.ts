// Small-sample honesty, in one tunable place. Below these, the UI shows
// a quiet "not enough data yet" state instead of a misleading number — and a
// trend plots points, not a line, until there's enough to imply a direction.

/** Decided games needed before a win rate is shown rather than "n=X". */
export const MIN_GAMES_FOR_WIN_RATE = 5

/** Rallies needed before a rally-level rate (serve %, bucket win %) is shown. */
export const MIN_RALLIES_FOR_RATE = 30

/** Matches needed before a trend is drawn as a line rather than bare points. */
export const MIN_MATCHES_FOR_TREND = 5

/** Tagged errors needed before an error-composition rate is shown. */
export const MIN_ERRORS_FOR_RATE = 15
