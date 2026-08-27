import { useState } from "react"

import { ScoreHeader } from "@/features/logger/components/score-header"
import {
  toggleServeNumber,
  toggleServeSide,
  toggleServer,
} from "@/lib/rally/rally-draft"
import { DEFAULT_HOUSE_RULES } from "@/lib/scoring"

import { IDS } from "#storybook/fixtures"

import type { DraftContext, RallyDraft } from "@/lib/rally/rally-draft"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

// The scorebug at the top of the logging surface: the derived score, plus the
// serve context the engine is only ever *suggesting*. Reach for it whenever a
// screen has to say who is serving from where — every chip on it, the serving
// dot included, is a tap-to-override, so the DB stores what actually happened.

type ScoreHeaderProps = ComponentProps<typeof ScoreHeader>

const draft = (overrides: Partial<RallyDraft> = {}): RallyDraft => ({
  serverId: IDS.sam,
  serveSide: "right",
  serveNumber: 1,
  winnerId: null,
  endReason: null,
  errorDetail: null,
  forced: null,
  shotType: null,
  shotCount: 1,
  ...overrides,
})

/** The overrides only teach their lesson if they move, so the story drives
 *  the same pure toggles the logging shell hands the header. */
function LiveScoreHeader({ draft: initial, ...props }: ScoreHeaderProps) {
  const [current, setCurrent] = useState(initial)
  const ctx: DraftContext = {
    player1Id: IDS.sam,
    player2Id: IDS.alex,
    rules: {
      ...DEFAULT_HOUSE_RULES,
      servesPerPoint: props.servesPerPoint === 1 ? 1 : 2,
    },
  }
  return (
    <ScoreHeader
      {...props}
      draft={current}
      onToggleServer={() => setCurrent(toggleServer(current, ctx))}
      onToggleSide={() => setCurrent(toggleServeSide(current))}
      onToggleServeNumber={() => setCurrent(toggleServeNumber(current, ctx))}
    />
  )
}

const meta = {
  title: "Logger/Score header",
  component: ScoreHeader,
  // in the app it sits on the deep panel — a broadcast graphic over the studio
  // floor. Off that ground the score reads as plain text on the page.
  decorators: [
    (Story) => (
      <div className="bg-panel-deep px-4 pt-3 pb-4">
        <Story />
      </div>
    ),
  ],
  render: (args) => <LiveScoreHeader {...args} />,
  args: {
    p1Name: "Sam",
    p2Name: "Alex",
    p1Id: IDS.sam,
    score: { p1: 8, p2: 6 },
    gameNumber: 2,
    rulesLine: "best of 5 · to 11 · two serves",
    draft: draft(),
    servesPerPoint: 2,
    onToggleServer: () => undefined,
    onToggleSide: () => undefined,
    onToggleServeNumber: () => undefined,
  },
} satisfies Meta<typeof ScoreHeader>

export default meta
type Story = StoryObj<typeof meta>

// Sam serving. The serve chips hang under the server's number, never the
// receiver's, and the receiver keeps its full colour — the dot marks the
// serve, dimming the other side would just make the score harder to read.
export const Default: Story = {}

// The same header with the blue side serving: both sides own a colour, so the
// score reads ember against blue whichever way round the serve is. Tap either
// name to move the dot — the engine suggested this, it didn't decide it.
export const AlexServing: Story = {
  name: "Alex serving",
  args: {
    score: { p1: 4, p2: 9 },
    draft: draft({ serverId: IDS.alex, serveSide: "left", serveNumber: 2 }),
  },
}

// Single-serve house rules: the 1st/2nd chip isn't offered at all, because
// there is no second serve to correct to. Only the box chip remains.
export const SingleServeMatch: Story = {
  name: "Single-serve match",
  args: {
    gameNumber: 1,
    score: { p1: 0, p2: 0 },
    rulesLine: "casual · to 15 · single serve",
    servesPerPoint: 1,
  },
}
