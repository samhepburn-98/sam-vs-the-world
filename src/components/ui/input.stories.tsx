import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The single-line text control behind every typed value in the app — match
// date, venue, points per game, the login pair. It is always full width, so
// the surrounding Field or grid column decides how wide it actually sits.

const meta = {
  title: "Primitives/Input",
  component: Input,
  args: { placeholder: "Local courts" },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="story-date">Date</Label>
        <Input id="story-date" type="date" defaultValue="2026-08-14" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="story-target">Points per game</Label>
        <Input
          id="story-target"
          type="number"
          min={1}
          max={99}
          defaultValue={11}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="story-email">Email</Label>
        <Input
          id="story-email"
          type="email"
          autoComplete="email"
          placeholder="sam@example.com"
        />
      </div>
    </div>
  ),
}

export const Invalid: Story = {
  args: { type: "email", defaultValue: "sam@", "aria-invalid": true },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "Local courts" },
}
