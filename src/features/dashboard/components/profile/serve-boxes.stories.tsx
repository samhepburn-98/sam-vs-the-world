import { ServeBoxes } from "@/features/dashboard/components/profile/serve-boxes"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The serve split left box against right box, with aces and double faults as
// the two punctuation marks underneath. Reach for it in the Serve panel of
// the profile's Stats tab, where the question is "which side do I serve from
// at game ball" — the stronger box takes the accent, and each rate carries
// the serves it was counted from.

const meta = {
  title: "Dashboard/Serve boxes",
  component: ServeBoxes,
  args: {
    serve: {
      left: { won: 30, of: 50 },
      right: { won: 28, of: 50 },
      aces: 6,
      doubleFaults: 2,
    },
  },
  render: (args) => (
    <div className="w-80">
      <ServeBoxes {...args} />
    </div>
  ),
} satisfies Meta<typeof ServeBoxes>

export default meta
type Story = StoryObj<typeof meta>

// Sam's serve, off the shared fixture: 60% from the left against 56% from
// the right. Four points is enough to move the accent, and both boxes print
// the 50 serves behind the rate so the reader can decide whether to believe
// a gap that narrow.
export const LeftBoxStronger: Story = {
  name: "Left box stronger",
}

// A box with no serves in it can never take the accent, however the other
// side is going — an unplayed box prints a dash rather than a flattering 0%.
export const OneBoxUnplayed: Story = {
  name: "One box unplayed",
  args: {
    serve: {
      left: { won: 19, of: 34 },
      right: { won: 0, of: 0 },
      aces: 3,
      doubleFaults: 1,
    },
  },
}

// A profile before its first logged serve. Both rates fall back to the dash,
// and the two chips still print their zeros rather than vanishing, so the
// panel keeps the shape it will have once the record fills in.
export const NoServesYet: Story = {
  name: "No serves yet",
  args: {
    serve: {
      left: { won: 0, of: 0 },
      right: { won: 0, of: 0 },
      aces: 0,
      doubleFaults: 0,
    },
  },
}
