import { ErrorBreakdown } from "@/features/dashboard/components/error-breakdown"
import { error as errorProfile } from "@/features/dashboard/lib/player-data.fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One error_profile drawn as two stacked rows: where each error died (tin,
// out, not up) and why (forced, unforced, untagged). Reach for it under
// "Where the points go" on the Errors category page, where the taxonomy
// itself is the subject — the error wall answers "where on court", this
// answers "of what kind, and whose fault".

const meta = {
  title: "Dashboard/Error breakdown",
  component: ErrorBreakdown,
  args: { profile: errorProfile() },
  render: (args) => (
    <div className="max-w-xl">
      <ErrorBreakdown {...args} />
    </div>
  ),
} satisfies Meta<typeof ErrorBreakdown>

export default meta
type Story = StoryObj<typeof meta>

// Sam, off the shared fixture: the tin leads the type row, forced beats
// unforced below it, and a thin untagged sliver closes both. The shape of a
// player who tags the detail most of the time.
export const MostlyTagged: Story = {
  name: "Mostly tagged",
}

// Untagged never folds into forced or unforced — it keeps its own neutral
// segment, so a thin logging habit is visible rather than flattered.
export const MostlyUntagged: Story = {
  name: "Mostly untagged",
  args: {
    profile: errorProfile({
      errors_total: 60,
      tin: 6,
      out_top: 3,
      out_side: 2,
      out_back: 1,
      not_up: 4,
      detail_untagged: 44,
      forced_errors: 7,
      unforced_errors: 9,
      untagged_errors: 44,
    }),
  },
}

// Both rows empty: the legend still names the full taxonomy, so the reader
// learns what will appear once rallies are logged.
export const NothingLoggedYet: Story = {
  name: "Nothing logged yet",
  args: {
    profile: errorProfile({
      errors_total: 0,
      forced_errors: 0,
      unforced_errors: 0,
      untagged_errors: 0,
      tin: 0,
      out_top: 0,
      out_side: 0,
      out_back: 0,
      not_up: 0,
      detail_untagged: 0,
      games_played: 0,
    }),
  },
}
