import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The naming half of a control: a Radix label, so clicking the text focuses
// the input it points at. Reach for it directly only outside a form — inside
// one use FieldLabel, which adds the Field's disabled and invalid handling.

const meta = {
  title: "Primitives/Label",
  component: Label,
  args: { children: "Points per game" },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithControl: Story = {
  name: "With a control",
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label htmlFor="story-label-target">Points per game</Label>
      <Input id="story-label-target" type="number" defaultValue={11} />
    </div>
  ),
}

export const Disabled: Story = {
  name: "Disabled control",
  render: () => (
    // The label dims with its group — mark the wrapper, not the label.
    <div className="group flex w-72 flex-col gap-2" data-disabled="true">
      <Label htmlFor="story-label-locked">Points per game</Label>
      <Input id="story-label-locked" type="number" defaultValue={11} disabled />
    </div>
  ),
}
