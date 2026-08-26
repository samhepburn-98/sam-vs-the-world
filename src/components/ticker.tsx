import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

// The ticker: a full-bleed strip in the player-one fill with dark condensed
// text, straight off a sports broadcast. One line of truth — a result, a
// status, a headline — never navigation. Items render with generous gaps;
// give it few, short items.

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
        "flex items-center gap-5 overflow-x-auto bg-primary px-4 py-1.5 font-heading text-sm font-bold tracking-[0.1em] whitespace-nowrap text-primary-foreground uppercase",
        className
      )}
    >
      {items.map((item, i) => (
        <span key={i} className="shrink-0">
          {item}
        </span>
      ))}
    </div>
  )
}
