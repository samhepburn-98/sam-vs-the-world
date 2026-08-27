import { Ticker } from "@/components/broadcast/ticker"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The full-bleed strip in the player-one fill, straight off a sports
// broadcast. Home runs exactly one — the last match, its result, then the date
// and venue — between the hero and the page column. One line of truth only: it
// never carries navigation, and it wants few items, each of them short.

const meta = {
  title: "Broadcast/Ticker",
  component: Ticker,
  parameters: { layout: "padded" },
  args: {
    items: ["Last match", "Alex beat Sam 3–1", "14 Jul · Local courts"],
  },
} satisfies Meta<typeof Ticker>

export default meta
type Story = StoryObj<typeof meta>

export const LastMatch: Story = {
  name: "Last match",
}

export const SingleItem: Story = {
  name: "Single item",
  args: { items: ["In play · Sam v Ormond"] },
}
