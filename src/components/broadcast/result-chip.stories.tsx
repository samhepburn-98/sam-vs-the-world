import { ResultChip } from "@/components/broadcast/result-chip"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One result as a square W/L/D chip in the status colours, always read from
// the first-named player's side. Screens do not reach for it directly: the
// roster row on home shows form through FormGuide, which keeps the last five
// in order. Take the bare chip only to mark a single result on its own.

const meta = {
  title: "Broadcast/Result chip",
  component: ResultChip,
  args: { result: "w" },
  argTypes: {
    result: { control: "inline-radio", options: ["w", "l", "d"] },
  },
} satisfies Meta<typeof ResultChip>

export default meta
type Story = StoryObj<typeof meta>

// One chip on its own, which is how a row usually carries it. Flip the result
// knob to walk through the three states the chip knows.
export const Default: Story = {}

// The whole vocabulary side by side: a win, a loss, a draw. They share a
// shape, so the status colour is the only thing telling them apart — it has
// to survive being read at a glance, in a line, at eleven pixels.
export const AllResults: Story = {
  name: "All results",
  render: () => (
    <div className="flex items-center gap-2">
      <ResultChip result="w" />
      <ResultChip result="l" />
      <ResultChip result="d" />
    </div>
  ),
}
