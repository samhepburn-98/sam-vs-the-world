import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

// The callout: a flat panel with a 4px accent bar on its left edge — the
// broadcast pundit graphic. The bar and label take a side's colour when the
// point belongs to a player, neutral when it's the house talking.

const SIDE = {
  p1: { bar: "border-primary", label: "text-primary-strong" },
  p2: { bar: "border-p2", label: "text-p2-strong" },
  neutral: { bar: "border-border", label: "text-muted-foreground" },
} as const

export function Callout({
  side = "neutral",
  label,
  title,
  children,
  className,
}: {
  side?: keyof typeof SIDE
  /** The tracked uppercase kicker, e.g. "Strength" or "The read". */
  label: string
  /** Optional bold one-liner between the kicker and the body. */
  title?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 border-l-4 bg-card px-3.5 py-2.5",
        SIDE[side].bar,
        className
      )}
    >
      <span
        className={cn(
          "font-heading text-xs font-bold tracking-[0.14em] uppercase",
          SIDE[side].label
        )}
      >
        {label}
      </span>
      {title && <span className="text-sm font-semibold">{title}</span>}
      {children && (
        <div className="text-xs leading-relaxed text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  )
}
