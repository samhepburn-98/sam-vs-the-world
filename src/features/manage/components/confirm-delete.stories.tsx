import { ConfirmDelete } from "@/features/manage/components/confirm-delete"

import { ALEX, ORMOND, SAM } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The stop before anything logged is destroyed. It is controlled all the way
// through: the caller closes it on success, so a refused delete stays on
// screen carrying the reason. Reach for it before any owner-only delete on
// /manage, and spend the description on what actually goes — the row on
// screen is never all of it.

const meta = {
  title: "Manage/Confirm delete",
  component: ConfirmDelete,
  args: {
    open: true,
    title: "Delete this match?",
    description: `${SAM.name} vs ${ALEX.name} · 2026-08-14 — deletes the match and all its games and rallies. This can't be undone.`,
    pending: false,
    error: null,
    onCancel: () => undefined,
    onConfirm: () => undefined,
  },
} satisfies Meta<typeof ConfirmDelete>

export default meta
type Story = StoryObj<typeof meta>

// Deleting a match takes its games and its rallies with it, so the sentence
// names all three and the match by its players and date. Cancel sits first
// and holds the quiet styling; there is no corner cross and the backdrop
// won't dismiss it.
export const Default: Story = {}

// In flight. The action goes busy and refuses a second press, and the dialog
// deliberately stays open — the click never closes it, only the outcome does.
export const InFlight: Story = {
  name: "In flight",
  args: { pending: true },
}

// The write came back refused, on the players tab, where the description is a
// warning rather than a cascade: a player in any match is protected by the
// schema. The friendly sentence lands above the buttons as an alert and
// everything stays exactly where it was, so nothing looks deleted that isn't.
export const Refused: Story = {
  args: {
    title: `Delete ${ORMOND.name}?`,
    description:
      "A player who appears in any match is protected — the delete will be refused.",
    error: "You don't have permission to change this — sign in as the owner.",
  },
}
