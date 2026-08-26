import { Callout } from "@/components/callout"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Callout",
  component: Callout,
  args: {
    tone: "p1",
    label: "Strength",
    title: "The serve is the weapon.",
    children:
      "58% of points won behind your own serve — 154 of 266 serve rallies.",
  },
} satisfies Meta<typeof Callout>

export default meta
type Story = StoryObj<typeof meta>

export const Strength: Story = {
  render: (args) => (
    <div className="w-80">
      <Callout {...args} />
    </div>
  ),
}

export const StrengthAndWeakness: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-2">
      <Callout tone="p1" label="Strength" title="The serve is the weapon.">
        58% of points won behind your own serve — 154 of 266 serve rallies.
      </Callout>
      <Callout tone="p2" label="Weakness" title="The return game leaks.">
        Just 36% of points won when receiving — a 22-point gap off the serve
        number.
      </Callout>
      <Callout tone="neutral" label="Form">
        1–3–1 in matches. Best streak: 9 points.
      </Callout>
    </div>
  ),
}
