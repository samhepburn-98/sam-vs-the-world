import { EyeIcon } from "lucide-react"

import { Toggle } from "@/components/ui/toggle"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One switch that stays down when it is on — a lone filter you flip, like
// "lets only" over a rally list. It keeps pressed state in the markup
// (`aria-pressed`), so a screen reader announces it as on or off. For a set
// of options where exactly one wins, use a toggle group instead.

const meta = {
  title: "Primitives/Toggle",
  component: Toggle,
  args: { children: "Show detail" },
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["sm", "default", "lg"] },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// On. The pressed fill is the only signal, so the label must read the same
// either way — "Show detail", never "Hide detail".
export const Pressed: Story = {
  args: { defaultPressed: true },
}

// Default fades into the page until pressed; outline keeps a border, which is
// what a filter row wants so the unpressed options still read as controls.
// A leading icon needs `data-icon="inline-start"` — that is what tightens the
// padding on that side.
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle>Show detail</Toggle>
      <Toggle variant="outline" defaultPressed>
        Lets only
      </Toggle>
      <Toggle variant="outline">
        <EyeIcon aria-hidden data-icon="inline-start" />
        Rally shapes
      </Toggle>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle size="sm" variant="outline">
        Small
      </Toggle>
      <Toggle size="default" variant="outline">
        Default
      </Toggle>
      <Toggle size="lg" variant="outline">
        Large
      </Toggle>
    </div>
  ),
}
