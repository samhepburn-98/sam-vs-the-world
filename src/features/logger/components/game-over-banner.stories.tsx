import { GameOverBanner } from "@/features/logger/components/game-over-banner"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The end-of-game prompt. Reach for it when the app has derived something the
// user might disagree with: the target has been crossed, but that is a
// suggestion, never a gate — casual play can keep logging straight past it and
// the derivation won't care. So it offers the next step without taking it.

const meta = {
  title: "Logger/Game over banner",
  component: GameOverBanner,
  args: {
    gameNumber: 2,
    gameWinnerName: "Sam",
    scoreline: "11–7",
    onStartNextGame: () => undefined,
    onFinishMatch: () => undefined,
  },
} satisfies Meta<typeof GameOverBanner>

export default meta
type Story = StoryObj<typeof meta>

// The game is won but the match isn't. The next-game button carries the whole
// decision — who serves it, and that it is game 3 — and "Played on? Just keep
// logging rallies." is the escape hatch for a session that ignored the target.
export const Default: Story = {}

// The game clinches a best-of match, so there is no next game to offer and
// starting one would contradict the format. Finish match becomes the primary
// action; the banner still won't press it for you.
export const MatchClinched: Story = {
  name: "Match clinched",
  args: { gameNumber: 3, scoreline: "11–9", matchWinnerName: "Sam" },
}
