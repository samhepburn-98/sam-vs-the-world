import { CategoryTiles } from "@/features/dashboard/components/profile/category-tiles"

import { withRouter } from "#storybook/decorators"
import { IDS, SAM_DATA, THIN_DATA } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// SAM_DATA carries no recent games — most components don't need them — but the
// form strip is the whole of the head-to-head tile's preview, so it gets a run
// of results here. Newest first, as the RPC returns them, and the third one
// ends level: the tile drops undecided games rather than drawing them as
// results, so five chips need six games.
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

const WITH_FORM = {
  ...SAM_DATA,
  headline: { ...SAM_DATA.headline!, recent_games: RECENT },
}

// The five doors off the profile, sitting between the hero and the tabs. The
// tabs tell the all-time story; a tile opens the page where that story takes
// filters and drills to the rallies underneath it. Each one previews what is
// behind it, so the row reads as five graphics rather than five buttons.
//
// Router only — the tiles are handed their data by the profile route, which
// has already fetched it, so nothing here queries.

const meta = {
  title: "Dashboard/Category tiles",
  component: CategoryTiles,
  parameters: { layout: "padded" },
  decorators: [withRouter],
  args: { playerId: IDS.sam, data: WITH_FORM },
} satisfies Meta<typeof CategoryTiles>

export default meta
type Story = StoryObj<typeof meta>

// A full season behind every tile. Two-up on a phone, five across from `lg` —
// stacked, they would put a screen and a half between the hero and the tabs.
export const Default: Story = {}

// The six insight payloads resolve independently, so the row has to hold its
// shape with only some of them in: the preview slot keeps its height and the
// line below shows a dash. Never a zero — that reads as a real measurement.
export const StillLoading: Story = {
  args: { data: { headline: WITH_FORM.headline, rally: SAM_DATA.rally } },
}

// Somebody who has played once. Every rate steps aside for its own count
// rather than quoting a percentage it can't stand behind (§3.5) — and the
// rally tile has no tagged lengths at all to average.
export const ThinSample: Story = {
  name: "Thin sample",
  args: { data: THIN_DATA },
}
