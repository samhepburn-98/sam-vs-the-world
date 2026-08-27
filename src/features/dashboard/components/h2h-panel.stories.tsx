import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"

import { H2hPanel } from "@/features/dashboard/components/h2h-panel"

import type { H2hResult } from "@/features/dashboard/schemas/insights"
import type { RallyScored } from "@/lib/schemas/rally"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"

// The compare panel and its drill-through, offline. The rally query is
// seeded under the same key the hook builds, so opening "Show the rallies"
// resolves from cache — the real component, the real code path.

const P1 = "11111111-1111-1111-1111-111111111111"
const P2 = "22222222-2222-2222-2222-222222222222"

const RALLIES: Array<RallyScored> = Array.from({ length: 6 }, (_, n) => {
  const i = n + 1
  return {
    id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
    game_id: "aaaaaaaa-0000-0000-0000-000000000001",
    rally_number: i,
    server_id: i % 2 === 0 ? P1 : P2,
    serve_side: i % 2 === 0 ? "left" : "right",
    serve_number: 1,
    winner_id: i % 3 === 0 ? P2 : P1,
    end_reason: i % 3 === 0 ? "error" : "winner",
    error_detail: i % 3 === 0 ? "tin" : null,
    forced: i % 3 === 0 ? true : null,
    winning_shot: i % 3 === 0 ? null : "drop",
    losing_shot: i % 3 === 0 ? "drive" : null,
    shot_count: 4 + i,
    match_id: "bbbbbbbb-0000-0000-0000-000000000001",
    game_number: 1,
    date: "2026-08-14",
    ball_type: "double_yellow",
    player1_id: P1,
    player2_id: P2,
    receiver_id: i % 2 === 0 ? P2 : P1,
    is_let: false,
    score_p1: i,
    score_p2: Math.max(0, i - 2),
  }
})

const H2H: H2hResult = {
  games_won_p1: 12,
  games_won_p2: 8,
  games_decided: 20,
  matches_won_p1: 4,
  matches_won_p2: 2,
  matches_decided: 6,
  match_history: [
    {
      match_id: "bbbbbbbb-0000-0000-0000-000000000001",
      date: "2026-06-02",
      games_won_p1: 3,
      games_won_p2: 1,
      winner_id: P1,
      outcome: "p1",
    },
    {
      match_id: "bbbbbbbb-0000-0000-0000-000000000002",
      date: "2026-07-11",
      games_won_p1: 1,
      games_won_p2: 3,
      winner_id: P2,
      outcome: "p2",
    },
    {
      match_id: "bbbbbbbb-0000-0000-0000-000000000003",
      date: "2026-08-03",
      games_won_p1: 2,
      games_won_p2: 2,
      winner_id: null,
      outcome: "draw",
    },
    // still being logged — a chip would claim a result that doesn't exist
    {
      match_id: "bbbbbbbb-0000-0000-0000-000000000004",
      date: "2026-08-19",
      games_won_p1: 1,
      games_won_p2: 1,
      winner_id: null,
      outcome: "pending",
    },
  ],
}

const NEVER_MET: H2hResult = {
  games_won_p1: 0,
  games_won_p2: 0,
  games_decided: 0,
  matches_won_p1: 0,
  matches_won_p2: 0,
  matches_decided: 0,
  match_history: [],
}

function Harness({ h2h, children }: { h2h: H2hResult; children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  qc.setQueryData(["insights", "h2h", P1, P2, {}], h2h)
  qc.setQueryData(["insights", "h2h-rallies", P1, P2, {}], RALLIES)

  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{children}</>,
  })
  const matchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/matches/$matchId",
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, matchRoute]),
    history: createMemoryHistory(),
  })
  return (
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

const meta = {
  title: "Dashboard/Head-to-head panel",
  component: H2hPanel,
  parameters: { layout: "padded" },
  args: { player1Id: P1, player2Id: P2, name1: "Sam", name2: "Alex" },
} satisfies Meta<typeof H2hPanel>

export default meta
type Story = StoryObj<typeof meta>

/** The record, the history, and the way into the rallies behind it. The
 *  drill-through is closed until asked for — click it to open the table. */
export const Met: Story = {
  render: (args) => (
    <Harness h2h={H2H}>
      <div className="mx-auto max-w-3xl">
        <H2hPanel {...args} />
      </div>
    </Harness>
  ),
}

export const NeverMet: Story = {
  render: (args) => (
    <Harness h2h={NEVER_MET}>
      <div className="mx-auto max-w-3xl">
        <H2hPanel {...args} />
      </div>
    </Harness>
  ),
}
