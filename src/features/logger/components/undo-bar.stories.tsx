import { UndoBar } from "@/features/logger/components/undo-bar"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One-action undo with a redo grace. Reach for it under any surface where the
// last action can be taken back — it names what it will reverse rather than
// saying "Undo", and it renders nothing at all when both labels are null, so
// the row costs no space before the first rally is logged.

const meta = {
  title: "Logger/Undo bar",
  component: UndoBar,
  args: {
    undoLabel: "Undo rally 12",
    redoLabel: null,
    onUndo: () => undefined,
    onRedo: () => undefined,
  },
} satisfies Meta<typeof UndoBar>

export default meta
type Story = StoryObj<typeof meta>

// Straight after a save. Undo reverses the last action, not just the last
// rally, so the label is the receipt for what is about to disappear.
export const Default: Story = {}

// Once the undo is spent, only the redo grace remains — and it is a grace,
// not a history: the next save or edit clears it.
export const AfterAnUndo: Story = {
  name: "After an undo",
  args: { undoLabel: null, redoLabel: "Redo rally 12" },
}

// Undoing the only rally of game 3 empties that game, so the undo chains: the
// next press removes the emptied game row itself and an orphan game becomes
// unrepresentable. Both actions are offered at once, and only here.
export const ChainedIntoTheGame: Story = {
  name: "Chained into the game",
  args: { undoLabel: "Undo game 3", redoLabel: "Redo rally 1" },
}
