import { Ticker } from "@/components/broadcast/ticker"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "Broadcast/Ticker",
  component: Ticker,
  parameters: { layout: "padded" },
  args: {
    items: ["Last match", "Alex d. Sam 6–0", "14 Jul · Hallamshire"],
  },
} satisfies Meta<typeof Ticker>

export default meta
type Story = StoryObj<typeof meta>

export const LastMatch: Story = {}

export const SingleItem: Story = {
  args: { items: ["Full time · Sam 5–2 Ormond"] },
}
