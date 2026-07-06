import { Link } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import type { CategoryKey } from "@/features/dashboard/categories"
import type { ReactNode } from "react"

// A category tile on the profile (§5.1) — a link into the deep page that
// previews what's inside: a small visual plus a line of real numbers, so it's
// worth looking at on its own, not just a button. All-time (the profile drops
// the filter bar); filtering lives on the category page it links to.

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
        "group bg-card text-card-foreground ring-foreground/10 flex flex-col gap-3 rounded-2xl p-5 ring-1 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-bold">{label}</h3>
        <ArrowRightIcon className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="flex min-h-16 items-center">{preview}</div>
      <p className="text-muted-foreground text-sm text-balance">{stat}</p>
    </Link>
  )
}
