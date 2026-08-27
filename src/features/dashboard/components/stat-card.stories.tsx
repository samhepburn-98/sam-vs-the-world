import { StatCard } from "@/features/dashboard/components/stat-card"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The receipt-carrying stat panel (§3.5 honesty rules): a rate is a
// { won, of } pair, so a percentage cannot render without its denominator.

const meta = {
  title: "Dashboard/Stat card",
  component: StatCard,
  args: { label: "Serve points won", rate: { won: 34, of: 61 } },
} satisfies Meta<typeof StatCard>

export default meta
type Story = StoryObj<typeof meta>

export const RateWithReceipt: Story = {
  args: { className: "w-64" },
}

export const PlainValue: Story = {
  args: {
    label: "Average rally",
    rate: undefined,
    value: 5.4,
    unit: "shots",
    hint: "across 567 rallies",
    className: "w-64",
  },
}

export const NotEnoughData: Story = {
  args: {
    label: "Return points won",
    rate: { won: 2, of: 4 },
    className: "w-64",
  },
}
