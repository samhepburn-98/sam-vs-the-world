import { StatTile } from "@/components/stat-tile"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Stat tile",
  component: StatTile,
  args: { label: "Win rate", value: 42, suffix: "%" },
} satisfies Meta<typeof StatTile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const KpiGrid: Story = {
  render: () => (
    <div className="grid w-96 grid-cols-3 gap-2">
      <StatTile label="Matches" value="1–3–1" detail="5 played" />
      <StatTile label="Games" value="12–20" accent />
      <StatTile label="Avg rally" value={5.4} decimals={1} />
      <StatTile label="Serve won" value={48} suffix="%" />
      <StatTile label="Streak" value="L2" />
      <StatTile label="Comebacks" value={3} />
    </div>
  ),
}

export const NotEnoughData: Story = {
  args: { label: "Return won", value: null },
}
