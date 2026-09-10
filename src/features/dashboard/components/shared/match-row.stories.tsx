import { MatchRow } from "@/features/dashboard/components/shared/match-row"

import { withRouter } from "#storybook/decorators"
import { IDS } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One match as a broadcast result line: names in the display face, the
// winner's in their side's colour. Reach for it in any neutral list of
// matches — home's recent results and the matches page render the same row,
// so a match never looks like two different things in two places. For a list
// owned by one player, reach for MatchHistory instead: it can say "won".

// Four separate matches, so no two rows lead to the same page. IDS.match is
// the shared fixture; the other three are local to this story.
const MATCH_IDS = {
  p1Win: IDS.match,
  p2Win: "66666666-6666-4666-8666-666666666666",
  draw: "77777777-7777-4777-8777-777777777777",
  pending: "88888888-8888-4888-8888-888888888888",
} as const

const meta = {
  title: "Dashboard/Match row",
  component: MatchRow,
  decorators: [withRouter],
  args: {
    matchId: MATCH_IDS.p1Win,
    date: "2026-07-14",
    p1Name: "Sam",
    p2Name: "Alex",
    p1Score: 3,
    p2Score: 1,
    outcome: "p1",
    venue: "Local courts",
    format: 5,
    ball: "double_yellow",
  },
} satisfies Meta<typeof MatchRow>

export default meta
type Story = StoryObj<typeof meta>

// A decided match with everything recorded: the winner's name and the score
// carry the side colour, and the meta line runs date · venue · format.
export const Result: Story = {}

// The four outcomes the row has to tell apart, newest first — the order both
// consumers list matches in. There is deliberately no W/L chip: a neutral list
// has no "this player" to judge from, so the only verdict is which name and
// score carry the colour.
export const EveryOutcome: Story = {
  name: "Every outcome",
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-1.5">
      <MatchRow
        matchId={MATCH_IDS.pending}
        date="2026-07-16"
        p1Name="Sam"
        p2Name="Alex"
        p1Score={null}
        p2Score={null}
        outcome="pending"
        venue="Local courts"
        format={5}
      />
      <MatchRow
        matchId={MATCH_IDS.p1Win}
        date="2026-07-14"
        p1Name="Sam"
        p2Name="Alex"
        p1Score={3}
        p2Score={1}
        outcome="p1"
        venue="Local courts"
        format={5}
        ball="double_yellow"
      />
      <MatchRow
        matchId={MATCH_IDS.p2Win}
        date="2026-07-09"
        p1Name="Sam"
        p2Name="Ormond"
        p1Score={1}
        p2Score={3}
        outcome="p2"
        venue="Local courts"
        format={5}
        ball="yellow"
      />
      <MatchRow
        matchId={MATCH_IDS.draw}
        date="2026-06-28"
        p1Name="Alex"
        p2Name="Ormond"
        p1Score={2}
        p2Score={2}
        outcome="draw"
        venue="Local courts"
        format={null}
        ball="double_yellow"
      />
    </div>
  ),
}

// Everything optional left out: no venue recorded, no format passed (home
// omits it), no ball logged. The meta line closes up around whatever it
// actually has, down to the date on its own.
export const MinimalMeta: Story = {
  name: "Minimal meta",
  args: { venue: null, format: undefined, ball: null },
}
