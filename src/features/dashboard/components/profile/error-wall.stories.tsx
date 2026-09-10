import { ErrorWall } from "@/features/dashboard/components/profile/error-wall"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The court seen from the back, with every way of giving a point away drawn
// where it happens. Reach for it as the hero of the profile summary's "Where
// the errors die" section, beside the insight column: whichever zone leads
// takes the deep fill, the share label and the scatter of balls, so the
// biggest leak is found by looking rather than by reading.

const meta = {
  title: "Dashboard/Error wall",
  component: ErrorWall,
  args: { wall: { tin: 24, outTop: 9, outSide: 7, outBack: 5, notUp: 12 } },
  render: (args) => (
    <div className="max-w-2xl">
      <ErrorWall {...args} />
    </div>
  ),
} satisfies Meta<typeof ErrorWall>

export default meta
type Story = StoryObj<typeof meta>

// The usual shape, and Sam's: 24 of 57 errors hit the tin, so the band along
// the bottom of the front wall takes the loud treatment and the share label
// that names it as 42% of everything given away.
export const TinLeads: Story = {
  name: "The tin leads",
}

// The emphasis is computed, never assumed: move the counts and the loud
// treatment moves down to the floor with them.
export const NotUpLeads: Story = {
  name: "Not up leads",
  args: { wall: { tin: 8, outTop: 4, outSide: 6, outBack: 3, notUp: 27 } },
}

// Errors logged without a location leave nothing to lead: no zone is lit, no
// share is claimed, and the court reads as the empty diagram it is.
export const NothingLocatedYet: Story = {
  name: "Nothing located yet",
  args: { wall: { tin: 0, outTop: 0, outSide: 0, outBack: 0, notUp: 0 } },
}
