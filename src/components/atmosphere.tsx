import { cn } from "@/lib/utils"

// The atmosphere (rule 03's first two gradients): a warm glow anchored to the
// top of the page, one per screen, always behind everything. Rendered as an
// absolutely positioned backdrop rather than a body background so the glow
// stays a viewport-scale halo instead of stretching over the whole document —
// and absolute (not fixed) because the route-fade's opacity animation would
// hijack a fixed element's containing block mid-transition.
//
// The root layout paints the solo tone on every screen; a screen with a duel
// on it (Compare) layers the split tone over it, later in the DOM, so the
// swap needs no route-level knowledge upstream.

export function Atmosphere({
  tone = "solo",
  className,
}: {
  tone?: "solo" | "duel"
  className?: string
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 -z-10 h-screen",
        tone === "duel" ? "bg-atmosphere-duel" : "bg-atmosphere",
        className
      )}
    />
  )
}
