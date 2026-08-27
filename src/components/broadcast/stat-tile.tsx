import { CountUp } from "@/components/broadcast/count-up"
import { cn } from "@/lib/utils"

// The small stat tile: one number, its label, optionally its receipt. This is
// the single shape behind the profile KPI grid and the "at a glance" strip —
// one place to define how a small number speaks (display face, tabular) and
// one place to keep the honesty rule: a null value renders a quiet dash,
// never an invented figure.

interface StatTileProps {
  label: string
  /** A number animates in via CountUp; a string renders as-is (records like
   *  "12–3" or "W4"); null shows the honest dash. */
  value: number | string | null
  /** Suffix for numeric values, e.g. "%". */
  suffix?: string
  decimals?: number
  /** Receipt line under the label (the opponent, the span, the sample). */
  detail?: string
  /** The hero number gets the accent colour. */
  accent?: boolean
  className?: string
}

export function StatTile({
  label,
  value,
  suffix = "",
  decimals = 0,
  detail,
  accent,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-3 text-card-foreground ring-1 ring-foreground/10",
        className
      )}
    >
      <p
        className={cn(
          "font-heading text-2xl font-bold tabular-nums",
          accent && "text-primary"
        )}
      >
        {value === null ? (
          <span className="text-muted-foreground">—</span>
        ) : typeof value === "number" ? (
          <CountUp value={value} decimals={decimals} suffix={suffix} />
        ) : (
          value
        )}
      </p>
      <p className="mt-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      {detail && (
        <p className="text-xs text-muted-foreground/70 tabular-nums">
          {detail}
        </p>
      )}
    </div>
  )
}
