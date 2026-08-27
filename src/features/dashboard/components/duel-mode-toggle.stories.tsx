import { useState } from "react"

import { DuelModeToggle } from "@/features/dashboard/components/duel-mode-toggle"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The scope switch above a duel: does a number mean this player's whole
// record, or only the games these two have shared? A segmented control rather
// than a pair of buttons, so the scope in force is always on screen — which
// matters, because it changes what every stat below it means.

const meta = {
  title: "Dashboard/Duel mode toggle",
  component: DuelModeToggle,
  args: { mode: "all", onChange: () => undefined },
} satisfies Meta<typeof DuelModeToggle>

export default meta
type Story = StoryObj<typeof meta>

// The default scope: each player's overall form, opponents and all.
export const AllGames: Story = {
  name: "All games",
}

// Scoped to the shared games. The control keeps its width, so switching
// scope never shifts the page beneath it.
export const HeadToHead: Story = {
  name: "Head to head",
  args: { mode: "h2h" },
}

// Wired to state, to feel the segment move. In the app the mode lives in the
// URL instead, so a duel stays shareable at the scope it was read in.
export const Interactive: Story = {
  render: () => {
    const [mode, setMode] = useState<"all" | "h2h">("all")
    return <DuelModeToggle mode={mode} onChange={setMode} />
  },
}
