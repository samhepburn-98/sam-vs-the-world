import {
  MomentumArea,
  MomentumChart,
} from "@/features/dashboard/components/momentum-chart"

import { IDS } from "#storybook/fixtures"

import type { LeadPoint } from "@/features/dashboard/components/momentum-chart"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { RallyScored } from "@/lib/schemas/rally"

// The signature diverging area: one game's lead, filled above the line while
// the player is ahead and below while behind. Reach for it whenever the story
// is the swing rather than the result — a comeback, a collapse, a game that
// was never in doubt. It reads from one player's side, so the same game
// mirrors when you ask it about the opponent.

/** A game written as a rally script — "1" and "2" are the point winners —
 *  folded into the running score the `rallies_scored` view returns. */
function game(script: string): Array<RallyScored> {
  let p1 = 0
  let p2 = 0
  return Array.from(script).map((outcome, i) => {
    if (outcome === "1") p1 += 1
    if (outcome === "2") p2 += 1
    return {
      id: `rally-${i + 1}`,
      game_id: "game-1",
      match_id: IDS.match,
      game_number: 1,
      date: "2026-07-14",
      rally_number: i + 1,
      server_id: IDS.sam,
      receiver_id: IDS.alex,
      serve_side: "right",
      serve_number: 1,
      winner_id: outcome === "1" ? IDS.sam : IDS.alex,
      end_reason: "winner",
      error_detail: null,
      forced: null,
      winning_shot: null,
      losing_shot: null,
      shot_count: 7,
      ball_type: "double_yellow",
      player1_id: IDS.sam,
      player2_id: IDS.alex,
      is_let: false,
      score_p1: p1,
      score_p2: p2,
    }
  })
}

/** Four down, then seven straight — the comeback the momentum RPC flags. */
const COMEBACK = game("21222211111112211221")

/** Ahead from the first rally to the last, so the fill never crosses zero. */
const WIRE_TO_WIRE = game("112121121212112121")

/** 4–0 up and lost it 11–8: a comeback seen from the wrong side. */
const COLLAPSE: Array<LeadPoint> = [
  1, 2, 3, 4, 3, 2, 1, 2, 1, 0, -1, 0, -1, -2, -1, -2, -3, -2, -3,
].map((lead, i) => ({ rally: i + 1, lead }))

const meta = {
  title: "Dashboard/Momentum chart",
  component: MomentumChart,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: { rallies: COMEBACK, playerId: IDS.sam },
} satisfies Meta<typeof MomentumChart>

export default meta
type Story = StoryObj<typeof meta>

// Sam trails 1–5, wins seven in a row, and takes it 11–9. The fill flips
// colour exactly where the lead crosses zero.
export const Comeback: Story = {}

// The same twenty rallies, asked about Alex instead: lead is always
// player minus opponent, so the shape turns upside down.
export const FromTheOpponentSide: Story = {
  name: "From the opponent's side",
  args: { playerId: IDS.alex },
}

// Never behind, so there is nothing below the line and the whole area keeps
// the ahead colour.
export const WireToWire: Story = {
  name: "Wire to wire",
  args: { rallies: WIRE_TO_WIRE },
}

// MomentumArea is the same picture without the rally rows — reach for it when
// the caller has already folded the lead itself and has no RallyScored shape
// to hand over.
export const PrecomputedLead: Story = {
  name: "Precomputed lead",
  render: () => <MomentumArea data={COLLAPSE} />,
}
