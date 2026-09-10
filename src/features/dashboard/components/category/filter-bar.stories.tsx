import { useState } from "react"

import { FilterBar } from "@/features/dashboard/components/category/filter-bar"

import { withQueryClient } from "#storybook/decorators"
import { IDS, ROSTER, SAM } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

// The one filter row every insight page shares: opponent, ball, date span.
// It holds no state — the route reads the URL, hands the search down, and
// navigates on change — so every filtered view is a shareable link. Reach for
// it directly under a page title, above the numbers it narrows.

// Stands in for the URL, so the controls in these stories actually move.
function UrlStandIn({ value, ...props }: ComponentProps<typeof FilterBar>) {
  const [search, setSearch] = useState(value)
  return <FilterBar {...props} value={search} onChange={setSearch} />
}

const meta = {
  title: "Dashboard/Filter bar",
  component: FilterBar,
  decorators: [
    withQueryClient((queryClient) => {
      queryClient.setQueryData(["players"], ROSTER)
    }),
  ],
  args: { value: {}, onChange: () => {}, excludePlayerId: IDS.sam },
  render: (args) => <UrlStandIn {...args} />,
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

// Nothing narrowed, so there is nothing to clear and the row stays quiet.
// This is Sam's own page: the opponent list is Alex and Ormond, because no
// one is ever offered as their own opponent.
export const Default: Story = {}

// Three filters live at once — every number on the page now reads "vs Alex,
// double yellow, July to late August". Only now does Clear appear, as the one
// way back to the whole record.
export const Filtered: Story = {
  args: {
    value: {
      vs: IDS.alex,
      ball: "double_yellow",
      from: "2026-07-01",
      to: "2026-08-27",
    },
  },
}

// A fresh account with only Sam on it. No one is ever offered as their own
// opponent, so excludePlayerId empties the list — and the select still keeps
// its "All opponents" option rather than collapsing, so the row never looks
// broken. (The story's own seed sits inside the meta one, so it wins.)
export const NoOpponentsYet: Story = {
  name: "No opponents yet",
  decorators: [
    withQueryClient((queryClient) => {
      queryClient.setQueryData(["players"], [SAM])
    }),
  ],
}
