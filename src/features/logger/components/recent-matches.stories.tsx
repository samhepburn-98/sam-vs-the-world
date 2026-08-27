import { RecentMatches } from "@/features/logger/components/recent-matches"

import { ALEX, IDS, ROSTER, SAM } from "#storybook/fixtures"

import type { MatchSummary } from "@/lib/schemas/match"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The reopen shelf under match setup: the last few nights, each one click from
// being added to. Every match is finished-as-logged (§2.6), so there is no
// "in progress" to resume — reopening is just appending or fixing rallies.
// Names are resolved against the roster handed in, never stored on the row.

const match = (over: Partial<MatchSummary>): MatchSummary => ({
  id: IDS.match,
  date: "2026-07-14",
  player1_id: IDS.sam,
  player2_id: IDS.alex,
  venue: "Local courts",
  format: 5,
  created_at: "2026-07-14T19:20:00Z",
  ...over,
})

const RECENT: Array<MatchSummary> = [
  match({}),
  match({
    id: "44444444-4444-4444-8444-000000000002",
    date: "2026-07-09",
    player2_id: IDS.ormond,
    format: null,
  }),
  match({
    id: "44444444-4444-4444-8444-000000000003",
    date: "2026-06-28",
    player1_id: IDS.alex,
    player2_id: IDS.ormond,
    format: 3,
  }),
]

const meta = {
  title: "Logger/Recent matches",
  component: RecentMatches,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: { matches: RECENT, players: ROSTER, onOpen: () => undefined },
} satisfies Meta<typeof RecentMatches>

export default meta
type Story = StoryObj<typeof meta>

// Three nights, newest first. The format badge is the one rule the row shows,
// because it is the one that changes what a scoreline means — a session with
// no best-of set reads "casual" rather than pretending to be a match.
export const Default: Story = {}

// Nothing logged yet — the first thing anyone sees on a new account. An empty
// court instead of an empty box, and a line pointing back up at the form
// rather than leaving the page looking broken.
export const NoMatchesYet: Story = {
  name: "No matches yet",
  args: { matches: [] },
}

// A match against somebody the roster no longer carries. The row still opens,
// because the rallies are the record — the missing name reads "Unknown"
// instead of dropping the match out of the list.
export const APlayerOffTheRoster: Story = {
  name: "A player off the roster",
  args: { players: [SAM, ALEX] },
}
