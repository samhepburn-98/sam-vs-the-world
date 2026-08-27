import { Callout } from "@/components/broadcast/callout"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The pundit panel: a 4px accent bar, a tracked kicker, and the sentence that
// says what a number means. Home's featured slot runs two beside the card
// ("The read", "Form"), and NarrativeInsight wraps it for every insight on the
// profile's Summary tab. Reach for InsightCard instead when the block is a
// link into a category page rather than a point made about a figure.

const meta = {
  title: "Broadcast/Callout",
  component: Callout,
  args: {
    side: "p1",
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
  name: "Strength and weakness",
  render: () => (
    <div className="flex w-80 flex-col gap-2">
      <Callout side="p1" label="Strength" title="The serve is the weapon.">
        58% of points won behind your own serve — 154 of 266 serve rallies.
      </Callout>
      <Callout side="p2" label="Weakness" title="The return game leaks.">
        Just 36% of points won when receiving — a 22-point gap off the serve
        number.
      </Callout>
      <Callout side="neutral" label="Form">
        1–3–1 in matches. Best streak: 9 points.
      </Callout>
    </div>
  ),
}
