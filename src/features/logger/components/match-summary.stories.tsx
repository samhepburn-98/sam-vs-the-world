import { MatchSummary } from "@/features/logger/components/match-summary"

import { withRouter } from "#storybook/decorators"
import { IDS } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The card the logger finishes on — press Finish and the logging shell returns
// this in place of the whole logging surface: a headline verdict, the rules the
// night ran under, and every game that got a score. Nothing here is stored;
// finishing writes nothing (§7.4), so every line is read back off the logged
// rallies and cannot disagree with the match page it hands off to. The three
// stories are the three headlines the shell can build.

const meta = {
  title: "Logger/Match summary",
  component: MatchSummary,
  decorators: [
    withRouter,
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
  args: {
    matchId: IDS.match,
    headline: "Sam wins 2–1",
    subline: "Sam vs Alex · 2026-07-14 · best of 3 · to 11 · two serves",
    games: [
      { gameNumber: 1, scoreline: "11–9", winnerName: "Sam" },
      { gameNumber: 2, scoreline: "7–11", winnerName: "Alex" },
      { gameNumber: 3, scoreline: "11–5", winnerName: "Sam" },
    ],
    onDone: () => undefined,
  },
} satisfies Meta<typeof MatchSummary>

export default meta
type Story = StoryObj<typeof meta>

// A best-of-three, clinched. Two ways on from here and no dead end: the match
// page for the numbers, or Done back to setup for the next one.
export const Default: Story = {}

// A casual session has no winner to crown, so the headline says drawn rather
// than inventing one — and a game stopped level reads "tied" instead of
// leaving the winner column blank.
export const ADrawnSession: Story = {
  name: "A drawn session",
  args: {
    headline: "Drawn 1–1",
    subline: "Sam vs Ormond · 2026-07-09 · casual · to 15 · single serve",
    games: [
      { gameNumber: 1, scoreline: "15–12", winnerName: "Sam" },
      { gameNumber: 2, scoreline: "13–15", winnerName: "Ormond" },
      { gameNumber: 3, scoreline: "8–8", winnerName: null },
    ],
  },
}

// Court time ran out one game into a best-of-five. There is no verdict to
// give, so the headline reports what was logged and claims nothing more.
export const StoppedEarly: Story = {
  name: "Stopped early",
  args: {
    headline: "Session logged — games 1–0",
    subline: "Sam vs Alex · 2026-07-16 · best of 5 · to 11 · two serves",
    games: [{ gameNumber: 1, scoreline: "11–4", winnerName: "Sam" }],
  },
}
