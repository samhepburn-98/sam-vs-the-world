import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/lib/use-media-query"

// A number that counts up from zero on mount — the one "stat reveal" flourish
// (§4.8). Two guards keep it honest: it respects prefers-reduced-motion (the
// final value shows at once), and it reserves the final width with an invisible
// sizer so the surrounding layout never reflows as digits appear (§10, no jank).

interface CountUpProps {
  value: number
  /** Decimal places — the intermediate frames format to match (e.g. 7.5). */
  decimals?: number
  /** Trailing unit rendered inside the number, e.g. "%". */
  suffix?: string
  durationMs?: number
  className?: string
}

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  durationMs = 650,
  className,
}: CountUpProps) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
  const [display, setDisplay] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (reduced) {
      setDisplay(value)
      return
    }
    let start: number | null = null
    const tick = (t: number) => {
      start ??= t
      const p = Math.min(1, (t - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic — quick then settles
      setDisplay(value * eased)
      if (p < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [value, durationMs, reduced])

  const fmt = (n: number) => n.toFixed(decimals)

  return (
    <span
      className={cn("inline-grid tabular-nums", className)}
      role="text"
      aria-label={`${fmt(value)}${suffix}`}
    >
      {/* sizer: holds the final width so digits appearing never shift layout */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {fmt(value)}
        {suffix}
      </span>
      <span aria-hidden className="col-start-1 row-start-1">
        {fmt(display)}
        {suffix}
      </span>
    </span>
  )
}
