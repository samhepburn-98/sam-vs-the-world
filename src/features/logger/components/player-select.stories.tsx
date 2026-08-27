import { useState } from "react"
import { screen, userEvent, within } from "storybook/test"

import { PlayerSelect } from "@/features/logger/components/player-select"

import { ALEX, ROSTER, SAM } from "#storybook/fixtures"

import type { PlayerSummary } from "@/lib/schemas/player"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

// The player slot in match setup: pick one of the roster, or type a name and
// have them exist. Reach for it anywhere a person has to be named — a new
// opponent turning up is the normal case on a Tuesday night, so creating one
// happens inside the field rather than on an admin page somewhere else.

/** The value belongs to the caller (react-hook-form, in the app), so a story
 *  has to hold it — and a created player joins the roster here the way the
 *  invalidated players query puts them there in the app. */
function LivePlayerSelect(props: ComponentProps<typeof PlayerSelect>) {
  const [value, setValue] = useState(props.value)
  const [roster, setRoster] = useState(props.players)
  return (
    <PlayerSelect
      {...props}
      players={roster}
      value={value}
      onChange={setValue}
      onCreatePlayer={async (name) => {
        const player = await props.onCreatePlayer(name)
        setRoster((current) => [...current, player])
        return player
      }}
    />
  )
}

/** Open the menu and drop into the inline "New player…" form. Radix portals
 *  the menu out of the canvas, so its options are looked up on the page; the
 *  pointer-events check goes with them, because the backdrop is still
 *  unwinding when the next click lands. Hands back the primed user. */
async function openNewPlayerForm(canvasElement: HTMLElement) {
  const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 })
  await user.click(within(canvasElement).getByRole("combobox"))
  await user.click(await screen.findByRole("option", { name: "New player…" }))
  return user
}

const meta = {
  title: "Logger/Player select",
  component: PlayerSelect,
  render: (args) => (
    <div className="w-72">
      <LivePlayerSelect {...args} />
    </div>
  ),
  args: {
    players: ROSTER,
    value: "",
    onChange: () => undefined,
    onCreatePlayer: async (name: string): Promise<PlayerSummary> => ({
      id: crypto.randomUUID(),
      name,
      handedness: null,
      avatar_url: null,
      is_protagonist: false,
    }),
  },
} satisfies Meta<typeof PlayerSelect>

export default meta
type Story = StoryObj<typeof meta>

// Nothing picked yet. The placeholder is muted, so an empty slot never reads
// as an answer somebody gave.
export const Default: Story = {}

// The menu open: the roster, a separator, then the way out of it. Pick a name
// and the trigger holds it — these stories keep the value, so the picker
// actually works rather than snapping back to the placeholder.
export const TheMenuOpen: Story = {
  name: "The menu open",
  play: async ({ canvasElement }) => {
    const user = userEvent.setup({ delay: null, pointerEventsCheck: 0 })
    await user.click(within(canvasElement).getByRole("combobox"))
  },
}

// Mid-add: the select is replaced by a name field with Add and Cancel, and
// nothing else on the form is disturbed. Ormond isn't on this roster yet, so
// he gets typed in here — he is picked the moment the insert returns.
export const AddingAPlayer: Story = {
  name: "Adding a player",
  args: { players: [SAM, ALEX] },
  play: async ({ canvasElement }) => {
    const user = await openNewPlayerForm(canvasElement)
    await user.type(
      within(canvasElement).getByPlaceholderText("Player name"),
      "Ormond"
    )
  },
}

// The insert failed. The typed name stays put, the field goes destructive
// under an alert, and Add can be pressed again — a dropped connection never
// costs somebody the thing they just typed.
export const TheAddFailed: Story = {
  name: "The add failed",
  args: {
    players: [SAM, ALEX],
    onCreatePlayer: () => Promise.reject(new Error("Offline")),
  },
  play: async ({ canvasElement }) => {
    const user = await openNewPlayerForm(canvasElement)
    const canvas = within(canvasElement)
    await user.type(canvas.getByPlaceholderText("Player name"), "Ormond")
    await user.click(canvas.getByRole("button", { name: "Add" }))
  },
}
