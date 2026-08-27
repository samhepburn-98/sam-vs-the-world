import { Button } from "@/components/ui/button"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The one button in the app: home's "Log a match" call to action, the ghost
// "View all" and "Compare" links beside section titles, every dialog action on
// /manage, and the logger's let. Where a row is a set of known values rather
// than actions — the winner pads, the ball filter — reach for ToggleGroup,
// which brings radio semantics and arrow-key focus with it.

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: { children: "Log a match" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "outline",
        "secondary",
        "ghost",
        "destructive",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg"],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Log a match</Button>
      <Button variant="secondary">Save changes</Button>
      <Button variant="outline">View match page</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Delete match</Button>
      <Button variant="link">View all</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true },
}
