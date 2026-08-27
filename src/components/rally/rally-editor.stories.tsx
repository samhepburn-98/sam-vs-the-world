import { RallyEditor } from "@/components/rally/rally-editor"
import { DEFAULT_HOUSE_RULES } from "@/lib/scoring"

import { IDS } from "#storybook/fixtures"

import type { DraftContext, RallyRow } from "@/lib/rally/rally-draft"
import type { Meta, StoryObj } from "@storybook/react-vite"

// A saved rally reopened as a draft (§5.3): the same state machine that
// logged it, but with every field on show. Reach for it wherever a logged
// rally needs correcting — inline in the logger's rally timeline, and in the
// /manage rally dialog, which retitles it "The missed rally" when inserting
// one that was never logged. It enforces the rules as you edit, so a bad row
// is unreachable.

const CTX: DraftContext = {
  player1Id: IDS.sam,
  player2Id: IDS.alex,
  rules: DEFAULT_HOUSE_RULES,
}

const rally = (overrides: Partial<RallyRow>): RallyRow => ({
  id: "rally-1",
  game_id: "game-1",
  rally_number: 14,
  server_id: IDS.sam,
  serve_side: "right",
  serve_number: 1,
  winner_id: IDS.alex,
  end_reason: "error",
  error_detail: "tin",
  forced: false,
  winning_shot: null,
  losing_shot: "drop",
  shot_count: 9,
  ...overrides,
})

const meta = {
  title: "Forms/Rally editor",
  component: RallyEditor,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    row: rally({}),
    ctx: CTX,
    p1Name: "Sam",
    p2Name: "Alex",
    onSave: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof RallyEditor>

export default meta
type Story = StoryObj<typeof meta>

// An unforced error — the widest the editor ever gets. Detail, forced and
// shot type all apply on top of the winner, serve and shot count.
export const Default: Story = {}

// A winner needs the shot but neither a detail nor a forced call. "Serve
// fault" isn't offered either: Sam served and Sam won the rally, so a fault
// is impossible until the server chip is corrected.
export const Winner: Story = {
  args: {
    row: rally({
      rally_number: 21,
      winner_id: IDS.sam,
      end_reason: "winner",
      error_detail: null,
      forced: null,
      winning_shot: "drive",
      losing_shot: null,
      shot_count: 4,
    }),
  },
}

// A point-ending fault is by definition lost by the server, so the editor
// holds the server opposite the winner and, in a two-serve match, on the
// second serve. Detail applies; forced and shot type don't.
export const ServeFault: Story = {
  name: "Serve fault",
  args: {
    row: rally({
      rally_number: 8,
      serve_number: 2,
      end_reason: "serve_fault",
      error_detail: "out_top",
      forced: null,
      losing_shot: null,
      shot_count: 1,
    }),
  },
}

// The mis-log fix: a let carries no winner, so choosing it clears the winner
// and hides the shot count. Tapping a winner takes the let back off — the end
// reason clears with it and the editor asks for a new one. It is also the
// row /manage seeds an insert with, on the bet that the missed rally was a
// let.
export const ConvertedToLet: Story = {
  name: "Converted to let",
  args: {
    row: rally({
      rally_number: 33,
      winner_id: null,
      end_reason: "let",
      error_detail: null,
      forced: null,
      losing_shot: null,
      shot_count: null,
    }),
  },
}

// Single-serve house rules: the serve-number chip isn't offered at all,
// because there is no second serve to correct to. A stroke asks for nothing
// beyond who won it and how long the rally ran.
export const SingleServeMatch: Story = {
  name: "Single-serve match",
  args: {
    ctx: { ...CTX, rules: { ...DEFAULT_HOUSE_RULES, servesPerPoint: 1 } },
    row: rally({
      rally_number: 5,
      end_reason: "stroke",
      error_detail: null,
      forced: null,
      losing_shot: null,
      shot_count: 12,
    }),
  },
}
