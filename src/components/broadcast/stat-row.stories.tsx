import { StatRow } from "@/components/broadcast/stat-row"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "Broadcast/Stat row",
  component: StatRow,
  args: { label: "Matches", value: "1–3–1" },
} satisfies Meta<typeof StatRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="w-72">
      <StatRow {...args} />
    </div>
  ),
}

export const Block: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1">
      <StatRow label="Matches" value="1–3–1" detail="5 played" />
      <StatRow label="Games" value="11–20" />
      <StatRow label="Best streak" value="9 points" />
      <StatRow label="Avg rally" value="5.4" detail="567 rallies" />
    </div>
  ),
}
