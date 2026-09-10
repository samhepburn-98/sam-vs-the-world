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

/** Serves from one box needed before the left/right split is compared. */
export const MIN_BOX_SERVES = 15

/** Tagged decisive shots needed before the shot mix is called a pattern. */
export const MIN_DECISIVE_FOR_MIX = 15

/** Rallies a drill-through table asks for. The list under a stat exists to
 *  show the rallies behind it, not to be an archive: past this many the table
 *  is a scroll nobody reads, and the payload grows with every session logged.
 *  The RPCs take the most recent n, and the table says so when it truncates. */
export const RALLY_DRILL_LIMIT = 50

/** Comeback games a drill-through asks for. Counted in games, not rallies:
 *  the momentum page draws one chart per game, and half a comeback is not a
 *  comeback. */
export const COMEBACK_GAME_LIMIT = 12
