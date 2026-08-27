import { useState } from "react"

import { OutcomeChips } from "@/features/logger/components/outcome-chips"
import { selectEndReason, setForced } from "@/lib/rally/rally-draft"
import { DEFAULT_HOUSE_RULES } from "@/lib/scoring"

import { IDS } from "#storybook/fixtures"

import type { DraftContext, RallyDraft } from "@/lib/rally/rally-draft"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

// The outcome form the logger opens the moment a winner is tapped. Reach for
// it as the model for any decision the app has to settle at review speed:
// every option names a player rather than "the opponent", the two common
// calls are cards settled by one visible fact, and the rare ones sit demoted.
// Only the fields valid for the chosen outcome exist — the draft state
// machine clears the rest, so an impossible rally can't be assembled.

type OutcomeChipsProps = ComponentProps<typeof OutcomeChips>

const CTX: DraftContext = {
  player1Id: IDS.sam,
  player2Id: IDS.alex,
  rules: DEFAULT_HOUSE_RULES,
}

const draft = (overrides: Partial<RallyDraft> = {}): RallyDraft => ({
  serverId: IDS.sam,
  serveSide: "right",
  serveNumber: 1,
  winnerId: IDS.sam,
  endReason: null,
  errorDetail: null,
  forced: null,
  shotType: null,
  shotCount: 1,
  ...overrides,
})

/** The chips are a thin skin over the draft state machine, so the story wires
 *  them to the very same pure functions the logging shell uses — press an
 *  outcome and the detail zone below really does reshape itself. */
function LiveChips({ draft: initial, ...props }: OutcomeChipsProps) {
  const [current, setCurrent] = useState(initial)
  return (
    <OutcomeChips
      {...props}
      draft={current}
      onEndReason={(reason) =>
        setCurrent(selectEndReason(current, reason, CTX))
      }
      onErrorDetail={(errorDetail) => setCurrent({ ...current, errorDetail })}
      onForced={(forced) => setCurrent(setForced(current, forced))}
      onShotType={(shotType) => setCurrent({ ...current, shotType })}
      onShotCount={(shotCount) => setCurrent({ ...current, shotCount })}
    />
  )
}

const meta = {
  title: "Logger/Outcome chips",
  component: OutcomeChips,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  render: (args) => <LiveChips {...args} />,
  args: {
    draft: draft(),
    winnerName: "Sam",
    loserName: "Alex",
    onEndReason: () => undefined,
    onErrorDetail: () => undefined,
    onForced: () => undefined,
    onShotType: () => undefined,
    onShotCount: () => undefined,
    onSave: () => undefined,
    onCancel: () => undefined,
    onOpenGlossary: () => undefined,
  },
} satisfies Meta<typeof OutcomeChips>

export default meta
type Story = StoryObj<typeof meta>

// The state the form opens in: the point is already Sam's, and the outcome is
// the only thing still required — so Save is disabled until one is chosen.
// "Serve fault" is missing because Sam served and Sam won the rally; a fault
// can't win the server the point, so it isn't offered until the server chip
// is corrected.
export const Default: Story = {}

// A winner asks for the shot and nothing else — there is no error to place
// and nobody to blame for it. Shot count still applies: every rally has one.
export const Winner: Story = {
  args: {
    draft: draft({ endReason: "winner", shotType: "drive", shotCount: 4 }),
  },
}

// An unforced error is the widest the form ever gets: where it went, why it
// went, and the shot Alex was playing when it did. Switch "Why" to forced and
// the tagged shot is retired rather than silently reassigned — it would then
// describe Sam's forcing shot, which is a different claim.
export const UnforcedError: Story = {
  name: "Unforced error",
  args: {
    draft: draft({
      endReason: "error",
      errorDetail: "tin",
      forced: false,
      shotType: "drop",
      shotCount: 11,
    }),
  },
}

// The receiver won off Sam's second serve, so the demoted "Sam faulted the
// serve" call appears. Choosing it corrects the server suggestion — a
// point-ending fault is by definition lost by the server.
export const ServeFault: Story = {
  name: "Serve fault",
  args: {
    winnerName: "Alex",
    loserName: "Sam",
    draft: draft({
      serveNumber: 2,
      winnerId: IDS.alex,
      endReason: "serve_fault",
      errorDetail: "out_top",
      shotCount: 1,
    }),
  },
}
