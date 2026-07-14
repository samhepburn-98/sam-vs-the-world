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
        "group flex flex-col gap-3 rounded-2xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-bold">{label}</h3>
        <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <div className="flex min-h-16 items-center">{preview}</div>
      <p className="text-sm text-balance text-muted-foreground">{stat}</p>
    </Link>
  )
}
