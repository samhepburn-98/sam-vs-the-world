import { screen, userEvent, within } from "storybook/test"

import { MatchSetup } from "@/features/logger/components/match-setup"

import { ROSTER } from "#storybook/fixtures"

import type { PlayerSummary } from "@/lib/schemas/player"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The front door to a logging session, and today the whole of the /entry
// page's "New match" section: two players (creatable in place), who serves
// first, when and where, and the house rules the night runs under. It owns its
// form state and validates with the same zod schema the insert uses, so a
// caller hands it one thing — an onStart that resolves to a friendly message
// when the write fails, or null once the match exists.

/** Pick Sam and Alex. The two player slots are the first two comboboxes on
 *  the form (the house rules' format select is the third), and their menus
 *  portal out of the canvas — so the options are looked up on the page, with
 *  the pointer-events check off while the closing menu unwinds. */
async function pickBothPlayers(canvasElement: HTMLElement) {
  const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 })
  const [player1, player2] = within(canvasElement).getAllByRole("combobox")
  await user.click(player1)
  await user.click(await screen.findByRole("option", { name: "Sam" }))
  await user.click(player2)
  await user.click(await screen.findByRole("option", { name: "Alex" }))
  return user
}

const meta = {
  title: "Logger/Match setup",
  component: MatchSetup,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    players: ROSTER,
    onCreatePlayer: async (name: string): Promise<PlayerSummary> => ({
      id: crypto.randomUUID(),
      name,
      handedness: null,
      avatar_url: null,
      is_protagonist: false,
    }),
    onStart: async (): Promise<string | null> => null,
  },
} satisfies Meta<typeof MatchSetup>

export default meta
type Story = StoryObj<typeof meta>

// The resting form, opened on today's date and the house defaults: a casual
// session to 11, win by two, two serves a point. Nothing is guessed for the
// two things only a person knows — who is playing, and who serves.
export const Default: Story = {}

// Submitted empty: the schema's own messages, one per field, and each Field
// goes destructive around its own. Nothing reaches the queue until they pass.
export const ValidationErrors: Story = {
  name: "Validation errors",
  play: async ({ canvasElement }) => {
    const user = userEvent.setup({ delay: null })
    await user.click(
      within(canvasElement).getByRole("button", { name: "Start logging" })
    )
  },
}

// Both players picked. The serve question can't be asked before there are two
// names to answer it with, so until then it holds a line of instruction rather
// than an empty control — and once it can, it names the actual players.
export const BothPlayersPicked: Story = {
  name: "Both players picked",
  play: async ({ canvasElement }) => {
    await pickBothPlayers(canvasElement)
  },
}

// The write was refused. A failed save isn't any one field's fault, so it
// belongs to the form: an alert above the button, everything typed still
// there, and no session started behind it.
export const TheSaveFailed: Story = {
  name: "The save failed",
  args: {
    onStart: async () =>
      "Couldn't save the match — check your connection and try again.",
  },
  play: async ({ canvasElement }) => {
    const user = await pickBothPlayers(canvasElement)
    const canvas = within(canvasElement)
    await user.click(await canvas.findByRole("radio", { name: "Sam" }))
    await user.click(canvas.getByRole("button", { name: "Start logging" }))
  },
}
