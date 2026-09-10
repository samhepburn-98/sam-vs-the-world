import { WinRateTrend } from "@/features/dashboard/components/category/win-rate-trend"

import type { TrendPoint } from "@/features/dashboard/components/category/win-rate-trend"
import type { Meta, StoryObj } from "@storybook/react-vite"

// Win rate match by match, on a fixed 0–100 scale so two seasons can be read
// against each other. Reach for it at the top of a category page when the
// question is "is this getting better?" — and note the honesty gate: under
// five matches it plots bare points, because a line between two dots claims a
// direction the data cannot support.

const SEASON: Array<TrendPoint> = [
  { date: "2026-03-14", winRate: 33 },
  { date: "2026-04-02", winRate: 38 },
  { date: "2026-04-21", winRate: 36 },
  { date: "2026-05-09", winRate: 44 },
  { date: "2026-05-30", winRate: 41 },
  { date: "2026-06-18", winRate: 49 },
  { date: "2026-07-14", winRate: 52 },
  { date: "2026-08-01", winRate: 50 },
  { date: "2026-08-22", winRate: 57 },
]

const meta = {
  title: "Dashboard/Win rate trend",
  component: WinRateTrend,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: { data: SEASON },
} satisfies Meta<typeof WinRateTrend>

export default meta
type Story = StoryObj<typeof meta>

// Nine matches of Sam's season: enough to join the dots up.
export const RisingForm: Story = {
  name: "Rising form",
}

// Four matches — one short of the threshold. The same series, the same dots,
// but the connecting line is withheld rather than implying a climb.
export const NotEnoughData: Story = {
  name: "Not enough data",
  args: { data: SEASON.slice(0, 4) },
}
