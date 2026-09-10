import { useState } from "react"

import { DuelPicker } from "@/features/dashboard/components/compare/duel-picker"

import { ALEX, ROSTER, SAM } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The setup for a duel: two player slots either side of the VS mark. The
// slots wear the sides they are choosing for — ember on the left, blue on the
// right — so picking already looks like the matchup it builds, and whoever
// fills one slot drops out of the other's list.

const meta = {
  title: "Dashboard/Duel picker",
  component: DuelPicker,
  args: {
    roster: ROSTER,
    selected: [SAM.id, ALEX.id],
    onPick: () => undefined,
  },
} satisfies Meta<typeof DuelPicker>

export default meta
type Story = StoryObj<typeof meta>

// A full matchup. A filled slot takes a ring in its own side's colour, so the
// pair reads as chosen rather than merely defaulted.
export const Default: Story = {}

// Nothing picked yet: both slots fall back to the placeholder, and the muted
// styling marks it as a prompt rather than an answer. This is how the compare
// page opens.
export const NothingChosenYet: Story = {
  name: "Nothing chosen yet",
  args: { selected: [] },
}

// Wired to state, opening on one slot filled — which is as far as the compare
// page gets before it shows its empty state. Open the second slot and Sam is
// missing from it, because a player cannot duel themselves.
export const Interactive: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<Array<string>>([SAM.id])
    return (
      <DuelPicker
        {...args}
        selected={selected}
        onPick={(index, id) =>
          setSelected((prev) => {
            const next = [prev[0], prev[1]]
            next[index] = id
            return next.filter((x): x is string => Boolean(x))
          })
        }
      />
    )
  },
}
