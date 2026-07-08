import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

// Shared building blocks for the match insight sections (§5.2). One dot
// language for player identity (p1 = primary, p2 = ink — as everywhere),
// one segment bar, one rate bar, one takeaway line.

export function PlayerLine({
  side,
  name,
  meta,
}: {
  side: "p1" | "p2"
  name: string
  meta?: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="flex items-center gap-2 text-sm font-medium">
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            side === "p1" ? "bg-primary" : "bg-foreground"
          )}
        />
        {name}
      </span>
      {meta && (
        <span className="text-xs text-muted-foreground tabular-nums">
          {meta}
        </span>
      )}
    </div>
  )
}

export interface Segment {
  count: number
  label: string
  className: string
}

/** A proportional stacked bar; zero segments vanish, counts print inside
 *  when a segment is wide enough, and the whole composition is read out
 *  for screen readers. */
export function SegmentBar({
  segments,
  srLabel,
}: {
  segments: Array<Segment>
  srLabel: string
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0)
  const shown = segments.filter((s) => s.count > 0)
  return (
    <div
      className="flex h-6 overflow-hidden rounded-md"
      role="img"
      aria-label={
        total === 0
          ? `${srLabel}: none.`
          : `${srLabel}: ${shown.map((s) => `${s.label} ${s.count}`).join(", ")}.`
      }
    >
      {total === 0 ? (
        <span className="h-full w-full bg-muted" />
      ) : (
        shown.map((s) => (
          <span
            key={s.label}
            style={{ width: `${(s.count / total) * 100}%` }}
            className={cn(
              "flex items-center justify-center text-[11px] font-medium",
              s.className
            )}
          >
            {s.count / total >= 0.12 && s.count}
          </span>
        ))
      )}
    </div>
  )
}

export function Legend({
  items,
}: {
  items: Array<{ label: string; className: string }>
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={cn("size-2.5 rounded-sm", i.className)}
          />
          {i.label}
        </span>
      ))}
    </div>
  )
}

/** One labelled proportion — a service box, a shot's share of winners. */
export function RateBar({
  label,
  fraction,
  valueText,
  valueTitle,
  fillClassName,
  strong = false,
}: {
  label: string
  fraction: number
  valueText: string
  /** hover detail, e.g. the raw counts behind a rate */
  valueTitle?: string
  fillClassName: string
  strong?: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full", fillClassName)}
          style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%` }}
        />
      </div>
      <span
        title={valueTitle}
        className={cn(
          "w-10 shrink-0 tabular-nums",
          strong ? "font-semibold" : "text-muted-foreground"
        )}
      >
        {valueText}
        {valueTitle && <span className="sr-only"> ({valueTitle})</span>}
      </span>
    </div>
  )
}

/** The section's one-line conclusion — rendered only when the data spoke. */
export function Takeaway({ text }: { text: string | null }) {
  if (!text) return null
  return <p className="pt-1 text-sm font-medium">{text}</p>
}
