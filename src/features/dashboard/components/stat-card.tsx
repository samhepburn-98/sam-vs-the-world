import type { ReactNode } from "react"

import { CountUp } from "@/components/broadcast/count-up"
import { Card } from "@/components/ui/card"
import { MIN_GAMES_FOR_WIN_RATE } from "@/features/dashboard/lib/insight-thresholds"
import { cn } from "@/lib/utils"

// StatCard (§6.1) enforces the §3.5 honesty rules by design:
//
//   · a rate is a { won, of } pair, never a bare number — so a percentage
//     literally cannot be rendered without the denominator beside it.
//   · below its minimum sample, it shows "not enough data yet (n=X)" instead
//     of a misleading figure.
//
// Non-rate stats (a count, an average) go through `value` and never grow a
// percent sign — the only path that divides is the rate path.

export interface Rate {
  won: number
  of: number
}

interface StatCardBase {
  label: string
  /** Sub-label under the number (e.g. the opponent, the span). */
  hint?: string
  /** Sample below which the "not enough data" state shows instead. */
  minSample?: number
  /** Optional mini-viz slot (sparkline, court, bucket bars). */
  children?: ReactNode
  className?: string
}

interface StatCardRateProps extends StatCardBase {
  /** A proportion shown as "62% · 15 of 22". Its own `of` is the sample, so
   *  a rate can never be gated on a number that isn't its denominator. */
  rate: Rate
  value?: never
  unit?: never
  sample?: never
}

interface StatCardValueProps extends StatCardBase {
  /** A plain stat — a count or an average. Never rendered as a percentage. */
  value: number | string
  /** Suffix for `value`, e.g. "per game" or "shots". */
  unit?: string
  /** How many observations `value` is drawn from — what the gate reads. */
  sample?: number
  rate?: never
}

// The two modes are exclusive by construction: a card is a rate or a plain
// value, never both and never neither. Without the union, `<StatCard rate={…}
// unit="shots" />` typechecks and quietly renders a percentage with a shots
// suffix, and a rate could be gated on a sample that isn't its denominator.
// stat-card.test.tsx pins all four of those with @ts-expect-error.
type StatCardProps = StatCardRateProps | StatCardValueProps

function pct(rate: Rate) {
  return Math.round((rate.won / rate.of) * 100)
}

export function StatCard({
  label,
  rate,
  value,
  unit,
  hint,
  minSample = MIN_GAMES_FOR_WIN_RATE,
  sample,
  children,
  className,
}: StatCardProps) {
  const effectiveSample = rate ? rate.of : sample
  const belowSample =
    effectiveSample !== undefined && effectiveSample < minSample

  return (
    <Card className={cn("gap-2 px-6", className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>

      {belowSample ? (
        <p className="text-sm text-balance text-muted-foreground">
          Not enough data yet{" "}
          <span className="tabular-nums">(n={effectiveSample})</span>
        </p>
      ) : (
        <>
          <p className="flex items-baseline gap-1.5">
            {rate ? (
              <>
                <span className="font-heading text-3xl font-bold">
                  <CountUp value={pct(rate)} suffix="%" />
                </span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  · {rate.won} of {rate.of}
                </span>
              </>
            ) : (
              <>
                <span className="font-heading text-3xl font-bold tabular-nums">
                  {typeof value === "number" ? (
                    <CountUp
                      value={value}
                      decimals={value.toString().split(".")[1]?.length ?? 0}
                    />
                  ) : (
                    value
                  )}
                </span>
                {unit && (
                  <span className="text-sm text-muted-foreground">{unit}</span>
                )}
              </>
            )}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </>
      )}

      {children}
    </Card>
  )
}
