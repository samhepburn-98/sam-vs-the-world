import { Badge } from "@/components/ui/badge"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The rounded pill for a fact that is not a number. Broadcast prefers flat
// graphics to boxes, so the app spends it sparingly — match detail tags the
// format with one ("Best of 5", "Casual") and little else does. For a player's
// trait line reach for TraitChip; for a W/L/D result, ResultChip.

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  args: { children: "Shotmaker" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "secondary",
        "destructive",
        "outline",
        "ghost",
        "link",
      ],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Shotmaker</Badge>
      <Badge variant="secondary">Grafter</Badge>
      <Badge variant="outline">Best of 5</Badge>
      <Badge variant="destructive">Unforced</Badge>
      <Badge variant="ghost">Marksman</Badge>
    </div>
  ),
}
