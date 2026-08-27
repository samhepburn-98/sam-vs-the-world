import { useState } from "react"

import { NumberStepper } from "@/components/ui/number-stepper"

import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

// A counter that stays typeable: the logger's shot count, where a rally of
// four is two taps and a rally of thirty is faster typed than clicked. It is
// controlled, so the parent owns the number — including null, which is a
// genuinely empty field rather than a zero nobody entered.

/** Stories own the value the way the rally draft does in the app. */
function StatefulStepper({
  value: initial,
  onChange,
  ...props
}: ComponentProps<typeof NumberStepper>) {
  const [value, setValue] = useState(initial)
  return (
    <NumberStepper
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

const meta = {
  title: "Primitives/Number stepper",
  component: NumberStepper,
  args: {
    value: 7,
    min: 0,
    max: 999,
    ariaLabel: "shot count",
    onChange: () => {},
  },
  // Remount when the value control changes, so the knob in Controls moves it.
  render: (args) => <StatefulStepper key={String(args.value)} {...args} />,
} satisfies Meta<typeof NumberStepper>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { value: null },
}

export const Bounds: Story = {
  name: "At the limits",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <StatefulStepper
          value={0}
          min={0}
          max={999}
          ariaLabel="shot count"
          onChange={() => {}}
        />
        <span className="text-sm text-muted-foreground">
          At the minimum, so there is nothing left to take away.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <StatefulStepper
          value={999}
          min={0}
          max={999}
          ariaLabel="shot count"
          onChange={() => {}}
        />
        <span className="text-sm text-muted-foreground">
          At the maximum — typing past it clamps back down.
        </span>
      </div>
    </div>
  ),
}
