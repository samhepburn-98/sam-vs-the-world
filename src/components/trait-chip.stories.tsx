import { TraitChip } from "@/components/trait-chip"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Trait chip",
  component: TraitChip,
  args: { children: "Grafter" },
} satisfies Meta<typeof TraitChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Traits: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <TraitChip>Sniper</TraitChip>
      <TraitChip>Shotmaker</TraitChip>
      <TraitChip>All-rounder</TraitChip>
      <TraitChip>Grafter</TraitChip>
      <TraitChip>Wall</TraitChip>
    </div>
  ),
}
