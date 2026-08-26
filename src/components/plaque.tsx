import { cn } from "@/lib/utils"

import type { ReactNode } from "react"

// The plaque: a card surface with the earned gradient edge (rule 03's fourth
// gradient). It stages something the data awarded — a verdict, a headline
// record — and is deliberately rare: most panels are flat cards; a plaque
// says this one was earned. Gold edge by default, blue for player-two.

export function Plaque({
  tone = "gold",
  className,
  innerClassName,
  children,
}: {
  tone?: "gold" | "p2"
  className?: string
  /** Styles the inner surface (default padding is px-4 py-3). */
  innerClassName?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-[calc(var(--radius-xl)+1.5px)] p-[1.5px]",
        tone === "gold" ? "bg-plaque-edge" : "bg-plaque-edge-p2",
        className
      )}
    >
      <div className={cn("rounded-xl bg-card px-4 py-3", innerClassName)}>
        {children}
      </div>
    </div>
  )
}
