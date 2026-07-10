import { MinusIcon, PlusIcon } from "lucide-react"
import { useRef } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// A shadcn-style number stepper: round − / + buttons flanking a value that's
// still typeable, so small tweaks are one tap and large jumps don't need a
// dozen clicks. `value` may be null (an empty field); the buttons step from
// `min`.

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  ariaLabel,
  className,
}: {
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  max?: number
  ariaLabel?: string
  className?: string
}) {
  const clamp = (n: number) => {
    let v = Math.max(min, n)
    if (max !== undefined) v = Math.min(max, v)
    return v
  }
  // track the live value in a ref so rapid clicks stack correctly — clicks can
  // fire faster than React re-renders, which would otherwise read a stale prop
  const latest = useRef(value)
  latest.current = value
  const step = (delta: number) => {
    const next = clamp((latest.current ?? min) + delta)
    latest.current = next
    onChange(next)
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : "Decrease"}
        disabled={value !== null && value <= min}
        onClick={() => {
          step(-1)
        }}
      >
        <MinusIcon />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : clamp(Number(e.target.value)))
        }
        className="w-10 bg-transparent text-center text-sm font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-full"
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : "Increase"}
        disabled={max !== undefined && value !== null && value >= max}
        onClick={() => {
          step(1)
        }}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
