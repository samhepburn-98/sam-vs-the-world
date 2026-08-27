import { RallyDetailSheet } from "@/features/dashboard/components/rally-detail-sheet"

import { withRouter } from "#storybook/decorators"
import { IDS } from "#storybook/fixtures"

import type { RallyScored } from "@/lib/schemas/rally"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The bottom of the drill chain: one rally, every tag it carries, in a
// slide-over that leaves the list behind it in place. Reach for it whenever a
// row is worth opening — the stepper walks the list without closing, and the
// footer link hands off to the match. Owned by its caller: `rally={null}`
// closes it, so these stories pin a rally in place to show it open.

const GAME_ID = "55555555-5555-4555-8555-555555555555"

const rally = (over: Partial<RallyScored>): RallyScored => ({
  id: "66666666-6666-4666-8666-000000000001",
  game_id: GAME_ID,
  match_id: IDS.match,
  game_number: 2,
  date: "2026-07-14",
  ball_type: "double_yellow",
  player1_id: IDS.sam,
  player2_id: IDS.alex,
  server_id: IDS.sam,
  receiver_id: IDS.alex,
  rally_number: 14,
  serve_side: "left",
  serve_number: 1,
  winner_id: IDS.sam,
  end_reason: "winner",
  error_detail: null,
  forced: null,
  winning_shot: "drop",
  losing_shot: null,
  shot_count: 12,
  is_let: false,
  score_p1: 7,
  score_p2: 5,
  ...over,
})

const meta = {
  title: "Dashboard/Rally detail sheet",
  component: RallyDetailSheet,
  decorators: [withRouter],
  args: {
    rally: rally({}),
    playerId: IDS.sam,
    onClose: () => {},
    onPrev: () => {},
    onNext: () => {},
    hasPrev: true,
    hasNext: true,
  },
} satisfies Meta<typeof RallyDetailSheet>

export default meta
type Story = StoryObj<typeof meta>

// A won rally, mid-list. The running score is oriented to `playerId`, so the
// page owner's number always comes first.
export const Default: Story = {}

// An error carries two extra lines the winner never has: which wall or line
// it went into, and whether the opponent forced it. Both only appear when the
// logger actually tagged them.
export const AnUnforcedError: Story = {
  name: "An unforced error",
  args: {
    rally: rally({
      winner_id: IDS.alex,
      end_reason: "error",
      error_detail: "tin",
      forced: false,
      winning_shot: null,
      losing_shot: "drive",
      shot_count: 9,
      score_p1: 7,
      score_p2: 6,
    }),
  },
}

// Logged at speed: a let, with no shot count, no forced call and no ball
// noted. Every untagged field drops out rather than printing a dash, so the
// sheet is only ever as long as the evidence.
export const AnUntaggedLet: Story = {
  name: "An untagged let",
  args: {
    rally: rally({
      winner_id: null,
      end_reason: "let",
      winning_shot: null,
      shot_count: null,
      ball_type: null,
      is_let: true,
    }),
  },
}

// Opened from the match page itself, on the last rally in the list: "Open in
// match" would go nowhere, so it is hidden, and Next has nothing left to step
// to.
export const OnTheMatchPage: Story = {
  name: "On the match page",
  args: { showMatchLink: false, hasNext: false },
}
