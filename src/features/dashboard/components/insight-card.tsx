import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { CategoryKey } from "@/features/dashboard/categories"
import type { ReactNode } from "react"

// A category tile on the profile (§5.1) — a link into the deep page that
// previews what's inside: a small visual plus a line of real numbers, so it's
// worth looking at on its own, not just a button. All-time (the profile drops
// the filter bar); filtering lives on the category page it links to.
//
// The shape is the broadcast accent-bar callout: flat panel, 4px bar on the
// left edge, condensed tracked label. The bar stays neutral and takes the
// ember on hover — it marks a door, not a value, so it wears no side colour.

export function InsightCard({
  playerId,
  category,
  label,
  preview,
  stat,
  className,
}: {
  playerId: string
  category: CategoryKey
  label: string
  /** The mini visual — court, bars, form dots. */
  preview: ReactNode
  /** The one-line read beneath it. */
  stat: ReactNode
  className?: string
}) {
  return (
    <Link
      to="/players/$playerId/$category"
      params={{ playerId, category }}
      className={cn(
        "group flex flex-col gap-3 border-l-4 border-border bg-card p-4 text-card-foreground transition-colors hover:border-primary hover:bg-accent",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-sm font-bold tracking-[0.14em] uppercase">
          {label}
        </h3>
        <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      {/* the slot keeps its height whether or not the payload has landed, so
          the row doesn't jump as the five queries resolve independently */}
      <div className="flex min-h-16 items-center">{preview}</div>
      <p className="text-xs text-balance text-muted-foreground">{stat}</p>
    </Link>
  )
}
