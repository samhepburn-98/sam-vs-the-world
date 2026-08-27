import { FormGuide } from "@/components/broadcast/form-guide"
import { InsightCard } from "@/features/dashboard/components/insight-card"
import { StatBarRow } from "@/features/dashboard/components/stat-bar-row"

import { withRouter } from "#storybook/decorators"
import { IDS } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The profile's category tile: a link into a deep page that previews what is
// inside — a small visual plus a line of real numbers, so it is worth reading
// on its own rather than being a dressed-up button. Reach for it whenever a
// page hands off to a deeper one and can afford to show its working first.

const meta = {
  title: "Dashboard/Insight card",
  component: InsightCard,
  decorators: [withRouter],
  args: {
    playerId: IDS.sam,
    category: "serve",
    label: "Serve",
    preview: (
      <div className="w-full">
        <StatBarRow label="Serve won" pct={58} value="58 of 100" />
        <StatBarRow label="Return won" pct={47} value="47 of 100" />
      </div>
    ),
    stat: "58% of points won behind your own serve — an 11-point gap on the return number.",
    className: "w-full max-w-sm",
  },
} satisfies Meta<typeof InsightCard>

export default meta
type Story = StoryObj<typeof meta>

// One tile on its own. The preview is a component from elsewhere in the kit
// and the stat line beneath it is a real read, so the tile earns its space
// before anyone clicks it.
export const CategoryTile: Story = {
  name: "Category tile",
}

// The five categories as the profile lays them out. Every preview is drawn
// with a component that already exists elsewhere in the kit — the tile is a
// frame, not a place to invent a new chart.
export const TheCategoryGrid: Story = {
  name: "The category grid",
  render: () => (
    <div className="grid w-full max-w-4xl gap-3 sm:grid-cols-2">
      <InsightCard
        playerId={IDS.sam}
        category="head-to-head"
        label="Head-to-head"
        preview={<FormGuide results={["l", "w", "w", "d", "w"]} />}
        stat="7 of 12 matches won, 24 games to 16."
      />
      <InsightCard
        playerId={IDS.sam}
        category="serve"
        label="Serve"
        preview={
          <div className="w-full">
            <StatBarRow label="Serve won" pct={58} value="58 of 100" />
            <StatBarRow label="Return won" pct={47} value="47 of 100" />
          </div>
        }
        stat="58% of points won behind your own serve — an 11-point gap on the return number."
      />
      <InsightCard
        playerId={IDS.sam}
        category="errors"
        label="Errors"
        preview={
          <div className="w-full">
            <StatBarRow label="Forced" pct={60} value="33 of 55" />
            <StatBarRow
              label="Unforced"
              pct={40}
              value="22 of 55"
              tone="loss"
            />
          </div>
        }
        stat="Three in five errors were forced out of you, not gifted cheaply."
      />
      <InsightCard
        playerId={IDS.sam}
        category="rallies"
        label="Rallies"
        preview={
          <div className="w-full">
            <StatBarRow label="Short (1–4)" pct={44} value="35 of 80" />
            <StatBarRow label="Extended (5+)" pct={54} value="65 of 120" />
          </div>
        }
        stat="8.4 shots on average across 200 rallies, and the longer they run the better they go."
      />
      <InsightCard
        playerId={IDS.sam}
        category="momentum"
        label="Momentum"
        preview={
          <div className="w-full">
            <StatBarRow label="Early points" pct={52} value="52 of 100" />
            <StatBarRow label="From 9–all" pct={64} value="32 of 50" />
          </div>
        }
        stat="Three comebacks from five points down; best streak of six in a row."
      />
    </div>
  ),
}
