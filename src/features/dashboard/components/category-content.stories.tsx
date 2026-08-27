import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"

import { CategoryContent } from "@/features/dashboard/components/category-content"
import {
  error,
  headline,
  momentum,
  rally,
  serve,
} from "@/features/dashboard/lib/player-data.fixtures"

import type { CategoryKey } from "@/features/dashboard/categories"
import type { RallyScored } from "@/lib/schemas/rally"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"

// The five category boards, rendered offline. Every hook underneath reads
// through TanStack Query, so seeding the cache under each hook's key renders
// the real component against fixture payloads — no network, no Supabase, and
// the same code path the live page takes.

const PLAYER = "11111111-1111-1111-1111-111111111111"
const OPPONENT = "22222222-2222-2222-2222-222222222222"
const FILTERS = {}

const scored = (i: number, over: Partial<RallyScored> = {}): RallyScored => ({
  id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
  game_id: `aaaaaaaa-0000-0000-0000-${String(i % 3).padStart(12, "0")}`,
  rally_number: i,
  server_id: i % 2 === 0 ? PLAYER : OPPONENT,
  serve_side: i % 2 === 0 ? "left" : "right",
  serve_number: 1,
  winner_id: i % 3 === 0 ? OPPONENT : PLAYER,
  end_reason: i % 3 === 0 ? "error" : "winner",
  error_detail: i % 3 === 0 ? "tin" : null,
  forced: i % 3 === 0 ? false : null,
  winning_shot: i % 3 === 0 ? null : "drive",
  losing_shot: i % 3 === 0 ? "drop" : null,
  shot_count: 3 + (i % 9),
  match_id: "bbbbbbbb-0000-0000-0000-000000000001",
  game_number: 1 + (i % 3),
  date: "2026-08-14",
  ball_type: "yellow",
  player1_id: PLAYER,
  player2_id: OPPONENT,
  receiver_id: i % 2 === 0 ? OPPONENT : PLAYER,
  is_let: false,
  score_p1: 1 + i,
  score_p2: Math.max(0, i - 2),
  ...over,
})

const RALLIES = Array.from({ length: 8 }, (_, i) => scored(i + 1))

const HEADLINE = headline({
  games_won: 34,
  games_decided: 52,
  matches_won: 11,
  matches_decided: 18,
  // newest first, as the RPC returns them
  recent_games: [6, 5, 4, 3, 2, 1].map((i) => ({
    game_id: `cccccccc-0000-0000-0000-${String(i).padStart(12, "0")}`,
    match_id: "bbbbbbbb-0000-0000-0000-000000000001",
    game_number: i,
    date: `2026-08-0${i}`,
    opponent_id: OPPONENT,
    player_score: i % 3 === 0 ? 8 : 11,
    opponent_score: i % 3 === 0 ? 11 : 7,
    // the middle one ends level — the D chip, not a W or an L
    won: i === 4 ? null : i % 3 !== 0,
  })),
})

const MOMENTUM = momentum({
  comebacks: 2,
  longest_streak: 7,
  comeback_games: [
    {
      game_id: "aaaaaaaa-0000-0000-0000-000000000001",
      match_id: "bbbbbbbb-0000-0000-0000-000000000001",
      date: "2026-08-04",
      max_deficit: 5,
      player_score: 12,
      opponent_score: 10,
    },
  ],
})

/** Seed every key the five boards read, so no hook ever reaches the network. */
function seededClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  })
  qc.setQueryData(["insights", "player-headline", PLAYER, FILTERS], HEADLINE)
  qc.setQueryData(["insights", "serve-stats", PLAYER, FILTERS], serve())
  qc.setQueryData(["insights", "serve-rallies", PLAYER, FILTERS], RALLIES)
  qc.setQueryData(["insights", "error-profile", PLAYER, FILTERS], error())
  qc.setQueryData(["insights", "error-rallies", PLAYER, FILTERS], RALLIES)
  qc.setQueryData(["insights", "rally-lengths", PLAYER, FILTERS], rally())
  qc.setQueryData(
    ["insights", "rally-length-rallies", PLAYER, null, FILTERS],
    RALLIES
  )
  qc.setQueryData(["insights", "momentum", PLAYER, FILTERS, null], MOMENTUM)
  qc.setQueryData(
    ["insights", "comeback-rallies", PLAYER, FILTERS, null],
    RALLIES
  )
  return qc
}

function Harness({ children }: { children: ReactNode }) {
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
    <QueryClientProvider client={seededClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

const board = (category: CategoryKey): Story => ({
  render: () => (
    <Harness>
      <div className="mx-auto max-w-5xl">
        <CategoryContent
          category={category}
          playerId={PLAYER}
          filters={FILTERS}
        />
      </div>
    </Harness>
  ),
})

const meta = {
  title: "Dashboard/Category boards",
  component: CategoryContent,
  parameters: { layout: "padded" },
  args: { category: "serve", playerId: PLAYER, filters: FILTERS },
} satisfies Meta<typeof CategoryContent>

export default meta
type Story = StoryObj<typeof meta>

export const HeadToHead: Story = board("head-to-head")
export const Serve: Story = board("serve")
export const Errors: Story = board("errors")
export const Rallies: Story = board("rallies")
export const Momentum: Story = board("momentum")
