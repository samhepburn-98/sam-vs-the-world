import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

// The ticker: a full-bleed strip in the player-one fill with dark condensed
// text, straight off a sports broadcast. One line of truth — a result, a
// status, a headline — never navigation. The strip runs edge to edge but the
// text sits in the page column. Items render with generous gaps; give it
// few, short items.

export function Ticker({
  items,
  className,
}: {
  items: Array<ReactNode>
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-primary font-heading text-sm font-bold tracking-[0.1em] whitespace-nowrap text-primary-foreground uppercase",
        className
      )}
    >
      <div className="container mx-auto flex max-w-5xl items-center gap-5 overflow-x-auto px-4 py-1.5">
        {items.map((item, i) => (
          <span key={i} className="shrink-0">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
