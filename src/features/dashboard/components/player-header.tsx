import { CountUp } from "@/components/count-up"
import { MIN_GAMES_FOR_WIN_RATE } from "@/features/dashboard/utils/insight-thresholds"

import type {
  PlayerHeadline,
  RallyLengths,
} from "@/features/dashboard/schemas/insights"
import type { Handedness } from "@/lib/schemas/enums"

// The player overview header (§5.1, §3.2): the win-rate hero with its
// denominator, the games/matches record, and the one-line signature read.

interface PlayerHeaderProps {
  name: string
  handedness: Handedness | null
  headline: PlayerHeadline
  lengths: RallyLengths
}

function bucketRate(wins: number, rallies: number): number | null {
  return rallies > 0 ? Math.round((wins / rallies) * 100) : null
}

/** "Grinder — wins 61% of 9+ shot rallies", etc. Null when the trait can't
 *  be called (too few rallies in a bucket) — the RPC already gates that. */
export function signatureLine(headline: PlayerHeadline, lengths: RallyLengths) {
  const long = bucketRate(lengths.long_wins, lengths.long_rallies)
  const short = bucketRate(lengths.short_wins, lengths.short_rallies)
  switch (headline.signature_trait) {
    case "grinder":
      return long === null
        ? "Grinder — stronger the longer the rally"
        : `Grinder — wins ${long}% of 9+ shot rallies`
    case "shotmaker":
      return short === null
        ? "Shotmaker — stronger in short rallies"
        : `Shotmaker — wins ${short}% of 1–3 shot rallies`
    case "balanced":
      return "Balanced — no clear long- or short-rally edge"
    default:
      return null
  }
}

export function PlayerHeader({
  name,
  handedness,
  headline,
  lengths,
}: PlayerHeaderProps) {
  const { games_won, games_decided, matches_won, matches_decided } = headline
  const enough = games_decided >= MIN_GAMES_FOR_WIN_RATE
  const signature = signatureLine(headline, lengths)

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {name}
        </h1>
        {handedness && (
          <span
            className="text-muted-foreground text-sm"
            title={`${handedness === "left" ? "Left" : "Right"}-handed`}
          >
            {handedness === "left" ? "Left-handed" : "Right-handed"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {enough ? (
          <p className="flex items-baseline gap-2">
            <span className="text-5xl font-bold">
              <CountUp
                value={Math.round((games_won / games_decided) * 100)}
                suffix="%"
              />
            </span>
            <span className="text-muted-foreground text-sm">
              win rate ·{" "}
              <span className="tabular-nums">
                {games_won} of {games_decided} games
              </span>
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">
            Not enough data yet{" "}
            <span className="tabular-nums">(n={games_decided})</span> to show a
            win rate
          </p>
        )}
        {matches_decided > 0 && (
          <span className="text-muted-foreground text-sm tabular-nums">
            {matches_won}–{matches_decided - matches_won} matches
          </span>
        )}
      </div>

      {signature && (
        <p className="text-muted-foreground text-sm italic">{signature}</p>
      )}
    </header>
  )
}
