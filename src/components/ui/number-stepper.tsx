import { MinusIcon, PlusIcon } from "lucide-react"
import { useRef } from "react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

// A number stepper composed from InputGroup: − / + buttons flanking a value
// that's still typeable, so small tweaks are one tap and large jumps don't
// need a dozen clicks. `value` may be null (an empty field); the buttons step
// from `min`.

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
    <InputGroup className={cn("w-28", className)}>
      <InputGroupAddon align="inline-start">
        <InputGroupButton
          size="icon-xs"
          className="rounded-full"
          aria-label={ariaLabel ? `Decrease ${ariaLabel}` : "Decrease"}
          disabled={value !== null && value <= min}
          onClick={() => {
            step(-1)
          }}
        >
          <MinusIcon />
        </InputGroupButton>
      </InputGroupAddon>
      <InputGroupInput
        type="number"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : clamp(Number(e.target.value)))
        }
        className="[appearance:textfield] text-center tabular-nums [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          className="rounded-full"
          aria-label={ariaLabel ? `Increase ${ariaLabel}` : "Increase"}
          disabled={max !== undefined && value !== null && value >= max}
          onClick={() => {
            step(1)
          }}
        >
          <PlusIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}
