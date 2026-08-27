import { Badge } from "@/components/ui/badge"

import type { Meta, StoryObj } from "@storybook/react-vite"

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
      <Badge variant="outline">Marksman</Badge>
      <Badge variant="destructive">Retired</Badge>
      <Badge variant="ghost">Ghost</Badge>
    </div>
  ),
}
