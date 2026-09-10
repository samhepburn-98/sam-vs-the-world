import { cn } from "@/lib/utils"

// The stat row: a broadcast lower-third line — tracked label left, value
// right, on a flat panel. Rows stack into the compact stat blocks the
// profile and head-to-head strips use. Reach for StatCard instead when the
// figure is a rate — only StatCard makes the denominator travel with the
// percentage.

export function StatRow({
  label,
  value,
  detail,
  className,
}: {
  label: string
  value: string
  /** Quiet suffix after the value (the sample, the span). */
  detail?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 bg-card px-3 py-1.5",
        className
      )}
    >
      <span className="font-heading text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">
        {value}
        {detail && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {detail}
          </span>
        )}
      </span>
    </div>
  )
}
