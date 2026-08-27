import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import { FilterBar } from "@/features/dashboard/components/filter-bar"

import type { InsightSearch } from "@/features/dashboard/utils/insight-filters"
import type { PlayerSummary } from "@/lib/schemas/player"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"

// The control strip. It owns no state — the route does — so the stories
// hold the search themselves and hand it straight back, which is exactly
// what navigate() does on the real page.

const ME = "11111111-1111-1111-1111-111111111111"

const ROSTER: Array<PlayerSummary> = [
  {
    id: ME,
    name: "Sam",
    avatar_url: null,
    handedness: "right",
    is_protagonist: true,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Alex",
    avatar_url: null,
    handedness: "left",
    is_protagonist: false,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Ormond",
    avatar_url: null,
    handedness: "right",
    is_protagonist: false,
  },
]

function Harness({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  qc.setQueryData(["players"], ROSTER)
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

function Live({ initial }: { initial: InsightSearch }) {
  const [search, setSearch] = useState(initial)
  return (
    <Harness>
      <FilterBar value={search} onChange={setSearch} excludePlayerId={ME} />
    </Harness>
  )
}

const meta = {
  title: "Dashboard/Filter bar",
  component: FilterBar,
  parameters: { layout: "padded" },
  args: { value: {}, onChange: () => {} },
} satisfies Meta<typeof FilterBar>

export default meta
type Story = StoryObj<typeof meta>

/** Nothing set: the bar is neutral and says so, and there's nothing to clear. */
export const Unfiltered: Story = { render: () => <Live initial={{}} /> }

/** The moment a filter bites, the edge takes the ember and the strip says
 *  "Filtered" — every number on the board below is now a subset, and a page
 *  quietly showing a subset has to admit it. */
export const Filtered: Story = {
  render: () => (
    <Live
      initial={{
        vs: "22222222-2222-2222-2222-222222222222",
        ball: "yellow",
        from: "2026-06-01",
      }}
    />
  ),
}
