import { StatRow } from "@/components/broadcast/stat-row"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The lower-third line: tracked label left, value right, on a flat panel. The
// profile header stacks them under the name so its KPIs read as one block.
// Reach for StatTile when the same figures sit in a grid instead, and for
// StatCard when the figure is a rate — only StatCard makes the denominator
// travel with the percentage.
//
// Every figure below is one buildKpis (features/dashboard/lib/
// profile-header.ts) actually emits, so the block reads exactly as the
// profile's own strip does.

const meta = {
  title: "Broadcast/Stat row",
  component: StatRow,
  args: { label: "Matches", value: "7–5–1", detail: "12 decided · 1 drawn" },
} satisfies Meta<typeof StatRow>

export default meta
type Story = StoryObj<typeof meta>

// One line, with the receipt trailing the value on the same baseline instead
// of sitting under it — the row's whole difference from the tile, and what
// lets a stack of them stay this short. The record here has a drawn session
// in it: a draw is a result, not a gap in the ledger, so the score grows a
// third figure and the receipt spells the split out.
export const Default: Story = {
  render: (args) => (
    <div className="w-72">
      <StatRow {...args} />
    </div>
  ),
}

// The profile header's block, two games into a first night. The stacking is
// the point: six lines in a narrow column, aligned on both edges, reading as
// one panel beside the player card where a grid of tiles would compete with
// it. A record needs a decided match before it says anything, so Matches
// dashes — while the counts and the longest rally are honest from game one.
export const Block: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1">
      <StatRow label="Matches" value="—" />
      <StatRow label="Games" value="1–1" detail="2 decided" />
      <StatRow label="Avg rally" value="5.2" detail="longest 12" />
      <StatRow label="Best streak" value="3" detail="points in a row" />
      <StatRow label="Comebacks" value="0" detail="games won from behind" />
      <StatRow label="Aces" value="1" detail="2 double faults" />
    </div>
  ),
}
