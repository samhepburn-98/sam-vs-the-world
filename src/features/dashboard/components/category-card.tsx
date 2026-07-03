import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { CategoryKey } from "@/features/dashboard/categories"
import type { InsightSearch } from "@/features/dashboard/utils/insight-filters"
import type { ReactNode } from "react"

// One of the five category summary cards on the player overview (§5.1). It's
// a link into the category detail page, carrying the active filters so they
// persist down the drill chain.

interface CategoryCardProps {
  playerId: string
  category: CategoryKey
  label: string
  blurb: string
  search: InsightSearch
  /** The headline stat for this category. */
  children: ReactNode
  className?: string
}

export function CategoryCard({
  playerId,
  category,
  label,
  blurb,
  search,
  children,
  className,
}: CategoryCardProps) {
  return (
    <Link
      to="/players/$playerId/$category"
      params={{ playerId, category }}
      search={search}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl bg-card p-6 text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-heading text-lg font-bold">{label}</h3>
        <ArrowRightIcon className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="flex-1">{children}</div>
      <p className="text-muted-foreground text-xs">{blurb}</p>
    </Link>
  )
}

/** The shared stat body for a card: a headline figure with its denominator,
 *  or the honest not-enough-data state (§3.5). */
export function CardStat({
  value,
  hint,
  belowSample,
  sample,
}: {
  value: ReactNode
  hint?: string
  belowSample: boolean
  sample: number
}) {
  if (belowSample) {
    return (
      <p className="text-muted-foreground text-sm">
        Not enough data yet <span className="tabular-nums">(n={sample})</span>
      </p>
    )
  }
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="text-3xl font-bold tabular-nums">{value}</span>
      {hint && <span className="text-muted-foreground text-sm">{hint}</span>}
    </p>
  )
}
