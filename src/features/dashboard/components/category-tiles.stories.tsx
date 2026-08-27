import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"

import { CategoryTiles } from "@/features/dashboard/components/category-tiles"

import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"

// Each tile links into its category page, so the stories mount a minimal
// memory router for the links to resolve against — same rig as RecordTile.

function StoryRouter({ children }: { children: ReactNode }) {
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{children}</>,
  })
  const categoryRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/players/$playerId/$category",
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, categoryRoute]),
    history: createMemoryHistory(),
  })
  return <RouterProvider router={router} />
}

const game = (i: number, won: boolean | null) => ({
  game_id: `g${i}`,
  match_id: `m${i}`,
  game_number: 1,
  date: `2026-08-0${i}`,
  opponent_id: "00000000-0000-0000-0000-0000000000ff",
  player_score: won ? 11 : 7,
  opponent_score: won ? 6 : 11,
  won,
})

/** One internally consistent season — the numbers across the five tiles all
 *  describe the same fictional player. */
const SEASON: PlayerData = {
  headline: {
    player_id: "00000000-0000-0000-0000-000000000001",
    games_won: 34,
    games_decided: 52,
    matches_won: 11,
    matches_decided: 18,
    signature_trait: "grinder",
    clean_finish_wins: 96,
    points_won: 421,
    recent_games: [1, 2, 3, 4, 5, 6].map((i) => game(i, i % 3 !== 0)),
  },
  serve: {
    rallies_served: 207,
    serve_wins: 120,
    rallies_returned: 198,
    return_wins: 88,
    aces: 9,
    double_faults: 6,
    two_serve_rallies_served: 150,
    first_serve_faults: 31,
    serve1_served: 150,
    serve1_wins: 92,
    serve2_served: 31,
    serve2_wins: 14,
    left_served: 104,
    left_wins: 67,
    right_served: 103,
    right_wins: 53,
  },
  error: {
    errors_total: 142,
    forced_errors: 48,
    unforced_errors: 79,
    untagged_errors: 15,
    tin: 41,
    out_top: 17,
    out_side: 9,
    out_back: 6,
    not_up: 22,
    detail_untagged: 47,
    games_played: 52,
    trend: [],
  },
  rally: {
    total_rallies: 405,
    avg_length: 6.2,
    longest: 24,
    short_rallies: 121,
    short_wins: 71,
    medium_rallies: 188,
    medium_wins: 96,
    long_rallies: 96,
    long_wins: 41,
  },
  momentum: {
    comebacks: 3,
    longest_streak: 7,
    longest_streak_game_id: "g2",
    early_rallies: 160,
    early_wins: 92,
    mid_rallies: 145,
    mid_wins: 71,
    close_rallies: 100,
    close_wins: 45,
    comeback_games: [],
  },
}

const meta = {
  title: "Dashboard/Category tiles",
  component: CategoryTiles,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <StoryRouter>
        <Story />
      </StoryRouter>
    ),
  ],
  args: { playerId: "p1", data: SEASON },
} satisfies Meta<typeof CategoryTiles>

export default meta
type Story = StoryObj<typeof meta>

/** The row as it sits on the profile: five doors, all payloads in. */
export const TheRow: Story = {}

/** Payloads arrive independently, so the row has to hold its shape with only
 *  some of them in — the slots keep their height and the missing lines show a
 *  dash, never a zero. */
export const StillLoading: Story = {
  args: { data: { headline: SEASON.headline, rally: SEASON.rally } },
}

/** Below the sample floors (§3.5) every rate steps aside for its count. */
export const ThinSample: Story = {
  args: {
    data: {
      headline: {
        ...SEASON.headline!,
        games_won: 2,
        games_decided: 3,
        matches_won: 1,
        matches_decided: 1,
        recent_games: [game(1, true), game(2, false)],
      },
      serve: { ...SEASON.serve!, rallies_served: 12, serve_wins: 7 },
      error: { ...SEASON.error!, games_played: 3, errors_total: 8 },
      rally: { ...SEASON.rally!, avg_length: null, total_rallies: 0 },
      momentum: { ...SEASON.momentum!, comebacks: 1, longest_streak: 2 },
    },
  },
}
