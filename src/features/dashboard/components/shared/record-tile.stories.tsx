import {
  RecordTile,
  RecordsWall,
} from "@/features/dashboard/components/shared/record-tile"

import { withRouter } from "#storybook/decorators"

import type { RecordTileDisplay } from "@/features/dashboard/lib/record-display"
import type { Meta, StoryObj } from "@storybook/react-vite"

// RecordTile links to the match its record was set in, so it needs the
// shared router harness.

const record = (overrides: Partial<RecordTileDisplay>): RecordTileDisplay => ({
  key: "longest_rally",
  title: "Longest rally",
  value: "23",
  unit: "shots",
  lead: "Alex",
  isHolder: true,
  rest: "14 Jul 2026",
  side: "p2",
  matchId: "m1",
  ...overrides,
})

const THE_WALL: Array<RecordTileDisplay> = [
  record({
    key: "biggest_win",
    title: "Biggest win",
    value: "3–0",
    unit: null,
    lead: "Sam",
    side: "p1",
  }),
  // Sam held this one from the p2 slot: blue on the wall (match-anchored),
  // repainted ember by the RecordsHeld story's side override below.
  record({ key: "longest_rally", lead: "Sam", matchId: "m2" }),
  record({
    key: "best_streak",
    title: "Best streak",
    value: "6",
    unit: "wins",
    lead: "Sam",
    side: "p1",
    matchId: "m3",
  }),
  record({
    key: "marathon_game",
    title: "Marathon game",
    value: "27",
    unit: "rallies",
    lead: "Sam v Alex",
    isHolder: false,
    rest: "15–13 · 14 Jul 2026",
    side: null,
    matchId: "m4",
  }),
  record({
    key: "most_aces",
    title: "Most aces in a match",
    value: "5",
    unit: null,
    lead: "Sam",
    side: "p1",
    matchId: "m5",
  }),
  record({
    key: "most_lets",
    title: "Most lets in a match",
    value: "9",
    unit: null,
    lead: "Sam v Ormond",
    isHolder: false,
    side: null,
    matchId: "m6",
  }),
]

const meta = {
  title: "Broadcast/Record tile",
  component: RecordTile,
  decorators: [withRouter],
  args: { record: record({}) },
} satisfies Meta<typeof RecordTile>

export default meta
type Story = StoryObj<typeof meta>

export const HolderRecord: Story = {
  name: "Holder record",
  render: (args) => (
    <div className="w-56">
      <RecordTile {...args} />
    </div>
  ),
}

export const MatchOwnedRecord: Story = {
  name: "Match-owned record",
  args: {
    record: record({
      key: "marathon_game",
      title: "Marathon game",
      value: "27",
      unit: "rallies",
      lead: "Sam v Alex",
      isHolder: false,
      rest: "15–13 · 14 Jul 2026",
      side: null,
    }),
  },
  render: (args) => (
    <div className="w-56">
      <RecordTile {...args} />
    </div>
  ),
}

export const TheWall: Story = {
  name: "The wall",
  render: () => (
    <div className="w-full max-w-2xl">
      <RecordsWall records={THE_WALL} />
    </div>
  ),
}

// The profile shelf: the same held records, every tile repainted in the
// player's own ember — including the longest rally Sam set from the p2
// slot, which the home wall shows in blue.
export const RecordsHeld: Story = {
  name: "Records held",
  render: () => (
    <div className="w-full max-w-2xl">
      <RecordsWall
        records={THE_WALL.filter((r) => r.lead === "Sam")}
        side="p1"
      />
    </div>
  ),
}
