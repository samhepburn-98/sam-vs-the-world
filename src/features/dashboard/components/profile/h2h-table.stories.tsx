import { H2hTable } from "@/features/dashboard/components/profile/h2h-table"

import type { H2hRow } from "@/features/dashboard/lib/profile-h2h"
import type { Meta, StoryObj } from "@storybook/react-vite"

// One row per rival: the match and game records as numbers, the games share
// as a bar so the balance of a rivalry reads without arithmetic, and the last
// result as a W, L or D chip. Reach for it in the Head-to-head panel of the
// profile's Stats tab, where the page has to answer "who is the problem"
// across a whole history of matches.

const RIVALRIES: Array<H2hRow> = [
  {
    rival: "Alex",
    matches: "2–5",
    games: "9–17",
    share: 35,
    last: "lost",
  },
  {
    rival: "Ormond",
    matches: "4–2",
    games: "13–9",
    share: 59,
    last: "won",
  },
]

const meta = {
  title: "Dashboard/Head-to-head table",
  component: H2hTable,
  args: { rows: RIVALRIES },
  render: (args) => (
    <div className="max-w-2xl">
      <H2hTable {...args} />
    </div>
  ),
} satisfies Meta<typeof H2hTable>

export default meta
type Story = StoryObj<typeof meta>

// The table draws the rows in the order computeH2h hands them over, most
// games played first. Alex is the problem: a 35% share, a short bar, and the
// last one lost — all of it legible before a single figure is read.
export const TwoRivals: Story = {
  name: "Two rivals",
}

// A drawn match is a real verdict here, not a missing one: it grows the match
// record a third figure and can stand as the last result.
export const RivalryWithDraws: Story = {
  name: "A rivalry with draws",
  args: {
    rows: [
      {
        rival: "Ormond",
        matches: "3–2–1",
        games: "12–12",
        share: 50,
        last: "drawn",
      },
    ],
  },
}

// Before any match reaches a result the table is its own header — the columns
// promise what will fill in rather than the panel vanishing.
export const NoRivalriesYet: Story = {
  name: "No rivalries yet",
  args: { rows: [] },
}
