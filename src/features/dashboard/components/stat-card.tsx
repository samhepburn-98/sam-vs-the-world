import type { ReactNode } from "react"

import { CountUp } from "@/components/count-up"
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

interface StatCardProps {
  label: string
  /** A proportion shown as "62% · 15 of 22"; gated on `of`. */
  rate?: Rate
  /** A plain stat — a count or an average. Never rendered as a percentage. */
  value?: number | string
  /** Suffix for `value` mode, e.g. "per game" or "shots". */
  unit?: string
  /** Sub-label under the number (e.g. the opponent, the span). */
  hint?: string
  /** Sample below which the "not enough data" state shows. For a plain
   *  `value`, pass `sample` too; a `rate` uses its own `of`. */
  minSample?: number
  sample?: number
  /** Optional mini-viz slot (sparkline, court, bucket bars). */
  children?: ReactNode
  className?: string
}

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
