import { cn } from "@/lib/utils"

import type { ComponentProps } from "react"

// The trait tag: a player's earned class line, spoken in the display face
// and the player's own colour — Broadcast's color law: every value that
// belongs to a player wears their side. Plain text, no box; broadcast
// graphics label, they don't decorate. Takes plain children so shared code
// stays ignorant of the trait model.

export function TraitChip({
  side = "p1",
  className,
  ...props
}: ComponentProps<"span"> & { side?: "p1" | "p2" }) {
  return (
    <span
      className={cn(
        "font-heading text-[13px] font-bold tracking-[0.12em] uppercase",
        side === "p1" ? "text-primary-strong" : "text-p2-strong",
        className
      )}
      {...props}
    />
  )
}
