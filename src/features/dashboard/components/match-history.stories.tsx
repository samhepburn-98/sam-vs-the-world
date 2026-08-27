import { MatchHistory } from "@/features/dashboard/components/match-history"
import { PROFILE_PANEL } from "@/features/dashboard/components/profile-section"

import { withRouter } from "#storybook/decorators"

import type { HistoryMatch } from "@/features/dashboard/lib/match-history"
import type { Meta, StoryObj } from "@storybook/react-vite"

// A player's match history, oriented to them: their games first in every
// score, the verdict from their side of the net. Reach for it on a profile,
// never in a neutral list — a W/L/D badge only means something when there is
// a "this player". One component, two renderings: a table from 640px up, a
// stacked list below it, switched by a CSS breakpoint rather than a hook.

const MATCHES: Array<HistoryMatch> = [
  {
    id: "m1",
    date: "16 Jul",
    opponent: "Alex",
    outcome: "pending",
    result: "1–0",
    ball: "double_yellow",
    games: ["11-8"],
  },
  {
    id: "m2",
    date: "14 Jul",
    opponent: "Alex",
    outcome: "won",
    result: "3–1",
    ball: "double_yellow",
    games: ["11-7", "9-11", "11-8", "11-6"],
    note: "Won five in a row from 6–9 down in the fourth.",
  },
  {
    id: "m3",
    date: "9 Jul",
    opponent: "Ormond",
    outcome: "lost",
    result: "1–3",
    ball: "yellow",
    games: ["11-9", "7-11", "8-11", "9-11"],
    note: "The tin cost eleven points on its own.",
  },
  {
    id: "m4",
    date: "28 Jun",
    opponent: "Alex",
    outcome: "drawn",
    result: "2–2",
    ball: "double_yellow",
    games: ["11-5", "8-11", "11-9", "6-11"],
  },
]

const meta = {
  title: "Dashboard/Match history",
  component: MatchHistory,
  decorators: [withRouter],
  args: { matches: MATCHES },
  render: (args) => (
    // the profile draws it inside one panel; the rows themselves are flat, so
    // no card ever floats inside another card
    <div className={`${PROFILE_PANEL} w-full max-w-3xl`}>
      <MatchHistory {...args} />
    </div>
  ),
} satisfies Meta<typeof MatchHistory>

export default meta
type Story = StoryObj<typeof meta>

// Every verdict at once: won, lost, drawn, and a match still in play — which
// gets a quiet dot rather than a false result.
export const Table: Story = {}

// The same rows below 640px, where the table's horizontal scroll would bury
// the note column: date moves to the right, the score pills stack under the
// opponent, and the whole row becomes the link.
export const PhoneList: Story = {
  name: "Phone list",
  parameters: {
    viewport: {
      options: {
        phone: {
          name: "Phone",
          styles: { width: "390px", height: "780px" },
          type: "mobile",
        },
      },
    },
  },
  globals: { viewport: { value: "phone" } },
}

// What a real history mostly looks like today: notes are not derived yet, and
// older matches predate ball logging. Both columns hold their place with a
// quiet dash instead of collapsing the grid.
export const NoNotesYet: Story = {
  name: "No notes yet",
  args: {
    matches: MATCHES.map((match) => ({
      ...match,
      ball: null,
      note: undefined,
    })),
  },
}
