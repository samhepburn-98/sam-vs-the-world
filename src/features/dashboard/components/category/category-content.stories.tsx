import { CategoryContent } from "@/features/dashboard/components/category/category-content"

import { withAppContext } from "#storybook/decorators"
import { IDS, SAM_DATA } from "#storybook/fixtures"

import type { CategoryKey } from "@/features/dashboard/lib/categories"
import type { RallyScored } from "@/lib/schemas/rally"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The five level-two boards, one per insight category: a key-stat row, the
// category's own graphic, then the rallies the numbers were counted from.
// Reached from the profile's category tiles, under the filter bar.
//
// Every panel reads through TanStack Query, so seeding the cache under each
// hook's key renders the real component on the real code path with nothing
// behind it. The keys are copied from the `api/` files — note that `momentum`
// and `comeback-rallies` both end on a trailing `deficit ?? null`.

const FILTERS = {}
const game = (n: number) => `55555555-5555-4555-8555-00000000000${n}`

const rally = (n: number): RallyScored => ({
  id: `66666666-6666-4666-8666-00000000000${n}`,
  game_id: game(n % 3),
  match_id: IDS.match,
  game_number: 1 + (n % 3),
  date: "2026-07-14",
  ball_type: "double_yellow",
  player1_id: IDS.sam,
  player2_id: IDS.alex,
  server_id: n % 2 === 0 ? IDS.sam : IDS.alex,
  receiver_id: n % 2 === 0 ? IDS.alex : IDS.sam,
  rally_number: n,
  serve_side: n % 2 === 0 ? "left" : "right",
  serve_number: 1,
  winner_id: n % 3 === 0 ? IDS.alex : IDS.sam,
  end_reason: n % 3 === 0 ? "error" : "winner",
  error_detail: n % 3 === 0 ? "tin" : null,
  forced: n % 3 === 0 ? false : null,
  winning_shot: n % 3 === 0 ? null : "drive",
  losing_shot: n % 3 === 0 ? "drop" : null,
  shot_count: 3 + (n % 9),
  is_let: false,
  score_p1: n,
  score_p2: Math.max(0, n - 2),
})

const RALLIES = Array.from({ length: 8 }, (_, i) => rally(i + 1))

// recent_games arrives newest-first, and the head-to-head board reverses it so
// the trend reads chronologically — the fixture has to be in that order too,
// or the chart runs right to left here and nowhere else. The fourth game ends
// level: that takes the D chip, not a W or an L.
const RECENT = [6, 5, 4, 3, 2, 1].map((i) => ({
  game_id: `77777777-7777-4777-8777-00000000000${i}`,
  match_id: IDS.match,
  game_number: i,
  date: `2026-08-0${i}`,
  opponent_id: IDS.alex,
  player_score: i % 3 === 0 ? 8 : 11,
  opponent_score: i % 3 === 0 ? 11 : 7,
  won: i === 4 ? null : i % 3 !== 0,
}))

const HEADLINE = { ...SAM_DATA.headline!, recent_games: RECENT }

const MOMENTUM = {
  ...SAM_DATA.momentum!,
  comeback_games: [
    {
      game_id: game(1),
      match_id: IDS.match,
      date: "2026-08-04",
      max_deficit: 5,
      player_score: 12,
      opponent_score: 10,
    },
  ],
}

const meta = {
  title: "Dashboard/Category boards",
  component: CategoryContent,
  parameters: { layout: "padded" },
  decorators: withAppContext((queryClient) => {
    const seed = (key: Array<unknown>, data: unknown) =>
      queryClient.setQueryData(key, data)
    seed(["insights", "player-headline", IDS.sam, FILTERS], HEADLINE)
    seed(["insights", "serve-stats", IDS.sam, FILTERS], SAM_DATA.serve)
    seed(["insights", "serve-rallies", IDS.sam, FILTERS], RALLIES)
    seed(["insights", "error-profile", IDS.sam, FILTERS], SAM_DATA.error)
    seed(["insights", "error-rallies", IDS.sam, FILTERS], RALLIES)
    seed(["insights", "rally-lengths", IDS.sam, FILTERS], SAM_DATA.rally)
    seed(["insights", "rally-length-rallies", IDS.sam, null, FILTERS], RALLIES)
    seed(["insights", "momentum", IDS.sam, FILTERS, null], MOMENTUM)
    seed(["insights", "comeback-rallies", IDS.sam, FILTERS, null], RALLIES)
  }),
  args: { category: "serve", playerId: IDS.sam, filters: FILTERS },
} satisfies Meta<typeof CategoryContent>

export default meta
type Story = StoryObj<typeof meta>

const board = (category: CategoryKey): Story => ({ args: { category } })

// Results and form — the one board that drills to matches rather than
// rallies, so its list is match links carrying a W/L/D chip each.
export const HeadToHead: Story = board("head-to-head")

// The court motif shaded by win rate, each box's reading as a lower-third
// beside it, then every rally served.
export const Serve: Story = board("serve")

// Where the points go, split by type and by cause.
export const Errors: Story = board("errors")

// The three length buckets, each annotated with the rate it was won at.
export const Rallies: Story = board("rallies")

// Phase win-share as three gated rates, then one diverging area per comeback.
export const Momentum: Story = board("momentum")
