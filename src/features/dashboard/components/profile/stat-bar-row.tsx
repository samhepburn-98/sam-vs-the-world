import { cn } from "@/lib/utils"

// One labelled proportion as a row: label, track, value. The workhorse of
// the Stats tab's small panels (pressure record, point-enders, errors
// given). `tone` separates earning (accent) from leaking (loss red) — the
// same shape reads differently because the colour carries the meaning.

export function StatBarRow({
  label,
  pct,
  value,
  tone = "accent",
}: {
  label: string
  /** Bar width, 0–100. */
  pct: number
  /** The printed figure, e.g. "17 of 35" or "24". */
  value: string
  tone?: "accent" | "loss"
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 py-1.5">
      <span className="truncate text-sm text-muted-foreground">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full",
            tone === "loss" ? "bg-error/80" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="min-w-14 text-right text-sm tabular-nums">{value}</span>
    </div>
  )
}
