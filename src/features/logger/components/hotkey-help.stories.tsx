import { useState } from "react"

import { HotkeyHelp } from "@/features/logger/components/hotkey-help"

import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

// The `?` cheat sheet: the only place the whole key map is written out, opened
// from the logging shell and nowhere else — the four groups *are* the rally
// keys, so there is nothing here to lift onto another screen. Rows are built
// from HOTKEY_HINTS, the same object the resolver reads, so a key can't be
// renamed in one place and go stale in the other. The dialog is the caller's
// state; the story pins it open (onClose is a no-op) so the sheet is on screen.

/** The footer toggle is the sheet's one live control — the story holds its
 *  state so it moves, the way the logging shell holds it in the app. */
function HotkeyHelpWithToggle(props: ComponentProps<typeof HotkeyHelp>) {
  const [hintsVisible, setHintsVisible] = useState(props.hintsVisible)
  return (
    <HotkeyHelp
      {...props}
      hintsVisible={hintsVisible}
      onToggleHints={setHintsVisible}
    />
  )
}

const meta = {
  title: "Logger/Hotkey help",
  component: HotkeyHelp,
  render: (args) => <HotkeyHelpWithToggle {...args} />,
  args: {
    open: true,
    hintsVisible: true,
    onClose: () => undefined,
    onToggleHints: () => undefined,
  },
} satisfies Meta<typeof HotkeyHelp>

export default meta
type Story = StoryObj<typeof meta>

// Four groups in the order a rally is logged: who won it, how it ended, what
// the error was, then the corrections. The footer says the quiet part out loud
// — the keys are the fast path, never the only one — and carries the sheet's
// one live control: the off switch for the little keycaps on the logger's own
// buttons, which are noise once the map is in somebody's hands. Press it and
// the label follows.
export const Default: Story = {}
