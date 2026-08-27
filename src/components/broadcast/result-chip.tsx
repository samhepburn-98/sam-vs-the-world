import { cn } from "@/lib/utils"

// The result chip: W / L / D in the status colours, square-cut, condensed.
// Results are read from the first-named player's perspective — one rule for
// every row, whoever is playing.

const RESULT = {
  w: { label: "W", classes: "bg-success/16 text-success" },
  l: { label: "L", classes: "bg-error/16 text-error" },
  d: { label: "D", classes: "bg-muted-foreground/20 text-muted-foreground" },
} as const

export function ResultChip({
  result,
  className,
}: {
  result: keyof typeof RESULT
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-px font-heading text-[11px] font-bold",
        RESULT[result].classes,
        className
      )}
    >
      {RESULT[result].label}
    </span>
  )
}
