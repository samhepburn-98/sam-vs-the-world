import type { ReactNode } from "react"

import { CountUp } from "@/components/broadcast/count-up"
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
//
// It speaks in StatRow's voice — condensed display number over a tracked
// label on a flat panel — so the key-stat row on a category page and the KPI
// strip on the profile read as one system. StatRow stays the shape where the
// number is always sayable; this is the shape that can decline to say it.

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
    <div
      className={cn(
        "flex flex-col gap-1 bg-card p-3.5 text-card-foreground ring-1 ring-foreground/10",
        className
      )}
    >
      <p className="font-heading text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>

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
                <span className="font-heading text-3xl leading-none font-extrabold tabular-nums">
                  <CountUp value={pct(rate)} suffix="%" />
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {rate.won} of {rate.of}
                </span>
              </>
            ) : (
              <>
                <span className="font-heading text-3xl leading-none font-extrabold tabular-nums">
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
                  <span className="text-xs text-muted-foreground">{unit}</span>
                )}
              </>
            )}
          </p>
          {hint && (
            <p className="text-xs text-muted-foreground/70 tabular-nums">
              {hint}
            </p>
          )}
        </>
      )}

      {children}
    </div>
  )
}
