import { TraitChip } from "@/components/broadcast/trait-chip"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Trait tag",
  component: TraitChip,
  args: { children: "Grafter" },
  argTypes: {
    tone: { control: "select", options: ["p1", "p2"] },
  },
} satisfies Meta<typeof TraitChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const BothSides: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <TraitChip tone="p1">Marksman</TraitChip>
      <TraitChip tone="p2">Shotmaker</TraitChip>
      <TraitChip tone="p1">Grafter</TraitChip>
    </div>
  ),
}
