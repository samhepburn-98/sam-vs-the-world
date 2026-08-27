import { ProfileHero } from "@/features/dashboard/components/profile-hero"
import {
  error,
  headline,
  momentum,
  player,
  rally,
  serve,
} from "@/features/dashboard/lib/player-data.fixtures"
import { computeProfileHeader } from "@/features/dashboard/lib/profile-header"

import { withRouter } from "#storybook/decorators"
import { ALEX, ALEX_DATA, SAM, SAM_DATA } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The top of a player profile, built as one broadcast graphic: the card, then
// name → trait → the read → six KPI rows. Purely presentational — hand it a
// ProfileHeaderData from computeProfileHeader and every honesty call has
// already been made. The page owner is always painted p1 (ember).

// A player two games into their first night: 23 rallies, every payload thin
// enough to trip its own threshold. Counts and records still show — they are
// not rates — but the win rate, the trait and all six attributes wait. The
// splits add up to the same 23 rallies, so the card cannot show a total the
// KPI rows disagree with.
const FIRST_NIGHT = player({
  headline: headline({
    signature_trait: null,
    games_won: 1,
    games_decided: 2,
    matches_won: 0,
    matches_decided: 0,
    clean_finish_wins: 5,
    points_won: 12,
  }),
  serve: serve({
    rallies_served: 12,
    serve_wins: 7,
    rallies_returned: 11,
    return_wins: 5,
    aces: 1,
    double_faults: 2,
    left_served: 6,
    left_wins: 4,
    right_served: 6,
    right_wins: 3,
  }),
  error: error({
    errors_total: 8,
    forced_errors: 3,
    unforced_errors: 4,
    untagged_errors: 1,
    tin: 3,
    out_top: 2,
    out_side: 1,
    out_back: 1,
    not_up: 1,
    detail_untagged: 0,
    games_played: 2,
  }),
  rally: rally({
    total_rallies: 23,
    avg_length: 5.2,
    longest: 12,
    short_rallies: 9,
    short_wins: 5,
    medium_rallies: 9,
    medium_wins: 5,
    long_rallies: 5,
    long_wins: 2,
  }),
  momentum: momentum({
    comebacks: 0,
    longest_streak: 3,
    early_rallies: 10,
    early_wins: 5,
    mid_rallies: 8,
    mid_wins: 4,
    close_rallies: 5,
    close_wins: 3,
  }),
})

const meta = {
  title: "Dashboard/Profile hero",
  component: ProfileHero,
  decorators: [withRouter],
  args: { header: computeProfileHeader(SAM, SAM_DATA) },
} satisfies Meta<typeof ProfileHero>

export default meta
type Story = StoryObj<typeof meta>

// A full record: the trait is called, so the chip and the one-line read that
// earned it both appear, with "Traits explained" alongside.
export const Default: Story = {}

// Alex, left-handed, with two drawn sessions. A draw is a result, not a gap,
// so the match record grows a third figure and the detail spells it out.
export const ARecordWithDraws: Story = {
  name: "A record with draws",
  args: { header: computeProfileHeader(ALEX, ALEX_DATA, 2) },
}

// Under sample: the card's win rate and all six attributes are dashes, there
// is no trait chip and therefore no read line, and the matches tile has
// nothing decided to report — while aces, best streak and longest rally are
// counted honestly from game one.
export const NotEnoughDataYet: Story = {
  name: "Not enough data yet",
  args: { header: computeProfileHeader(SAM, FIRST_NIGHT) },
}
