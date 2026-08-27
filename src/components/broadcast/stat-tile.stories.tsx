import { StatTile } from "@/components/broadcast/stat-tile"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One number, its label, and optionally its receipt — the kit's shape for a
// grid of small figures, and the one place the honesty rule lives: a null
// value renders a quiet dash, never an invented figure. Reach for StatRow when
// the figures stack as lines, as the profile header's KPIs do, and for
// StatCard when the figure is a rate that must carry its denominator.
//
// The figures below are ones buildKpis (features/dashboard/lib/
// profile-header.ts) actually computes, here for the cast's Sam: counting
// stats and records only, never a rate — the win rate belongs to the player
// card, and its six attributes to the card's own grid.

const meta = {
  title: "Broadcast/Stat tile",
  component: StatTile,
  args: { label: "Avg rally", value: 8.4, decimals: 1, detail: "longest 34" },
} satisfies Meta<typeof StatTile>

export default meta
type Story = StoryObj<typeof meta>

// Handed a number, the tile counts up to it and rounds to the decimals asked
// for. The profile builder pre-formats to a string instead, which renders
// as-is; the digits are tabular either way, so a grid of them never jitters
// as the numbers land.
export const Default: Story = {}

// The six the profile builds, in the grid the tile exists for: two records,
// an average and three counts, each cell carrying the same weight so the eye
// scans the block rather than a list. Every value arrives as a string here —
// "7–5" is a match record, not a subtraction to animate.
export const KpiGrid: Story = {
  name: "KPI grid",
  render: () => (
    <div className="grid w-96 grid-cols-3 gap-2">
      <StatTile label="Matches" value="7–5" detail="12 decided" />
      <StatTile label="Games" value="24–16" detail="40 decided" />
      <StatTile label="Avg rally" value="8.4" detail="longest 34" />
      <StatTile label="Best streak" value="6" detail="points in a row" />
      <StatTile label="Comebacks" value="3" detail="games won from behind" />
      <StatTile label="Aces" value="6" detail="2 double faults" />
    </div>
  ),
}

// The accent, the one thing a stacked row has no answer to: in a grid of
// equals it marks the number the panel was built around. The KPI shape
// carries the flag per tile, so the caller picks its hero rather than the
// tile assuming one.
export const Accented: Story = {
  args: { accent: true },
}

// A tile whose payload has not landed: the quiet dash, never a zero and never
// a guess. The receipt goes with it, because there is nothing yet to receipt.
export const NotEnoughData: Story = {
  name: "Not enough data",
  args: { label: "Matches", value: null, detail: "" },
}
