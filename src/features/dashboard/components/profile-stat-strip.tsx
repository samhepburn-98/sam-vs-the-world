import { CountUp } from "@/components/count-up"
import {
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/utils/insight-thresholds"

import type {
  ErrorProfile,
  Momentum,
  RallyLengths,
  ServeStats,
} from "@/features/dashboard/schemas/insights"

// The "at a glance" strip on the profile (§5.1): the player's defining numbers
// up front, so the page says something before you click anything. Rates carry
// the §3.5 honesty rule — below their sample they show "—" rather than a
// figure resting on nothing. Counts (aces, comebacks) are always safe to show.

interface Tile {
  label: string
  value: number | null
  suffix?: string
  decimals?: number
}

function rateTile(
  label: string,
  won: number,
  of: number,
  min: number,
): Tile {
  return {
    label,
    value: of >= min ? Math.round((won / of) * 100) : null,
    suffix: "%",
  }
}

export function ProfileStatStrip({
  serve,
  errors,
  lengths,
  momentum,
}: {
  serve: ServeStats
  errors: ErrorProfile
  lengths: RallyLengths
  momentum: Momentum
}) {
  const tiles: Array<Tile> = [
    rateTile("Serve won", serve.serve_wins, serve.rallies_served, MIN_RALLIES_FOR_RATE),
    rateTile("Return won", serve.return_wins, serve.rallies_returned, MIN_RALLIES_FOR_RATE),
    { label: "Aces", value: serve.aces },
    {
      label: "Unforced / game",
      value:
        errors.games_played >= MIN_GAMES_FOR_WIN_RATE
          ? errors.unforced_errors / errors.games_played
          : null,
      decimals: 1,
    },
    {
      label: "Avg rally",
      value: lengths.total_rallies >= MIN_RALLIES_FOR_RATE ? lengths.avg_length : null,
      decimals: 1,
    },
    { label: "Comebacks", value: momentum.comebacks },
  ]

  return (
    <section aria-label="At a glance">
      <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-widest uppercase">
        At a glance
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <div key={t.label} className="bg-card rounded-xl p-3 ring-1 ring-foreground/10">
            <p className="text-2xl font-bold tabular-nums">
              {t.value === null ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <CountUp value={t.value} decimals={t.decimals ?? 0} suffix={t.suffix ?? ""} />
              )}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">{t.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
