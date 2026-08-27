import { Button } from "@/components/ui/button"
import { Kbd, KbdHintsContext } from "@/components/ui/kbd"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The key cap the logger paints on its controls (§5.3) so the hotkeys are
// learnt by using the buttons. Decoration only — aria-hidden and unfocusable
// — and it reads KbdHintsContext, so every hint on screen vanishes together
// when the `?` cheat sheet switches them off.

const meta = {
  title: "Primitives/Kbd",
  component: Kbd,
  // Caps carry the raw key, lowercase, exactly as HOTKEY_HINTS stores it.
  args: { children: "w" },
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const OnAControl: Story = {
  name: "On a control",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline">
        <Kbd>w</Kbd>
        Winner
      </Button>
      <Button variant="outline">
        <Kbd>e</Kbd>
        Error
      </Button>
      <Button variant="outline">
        <Kbd>k</Kbd>
        Stroke
      </Button>
      {/* Two keys in one cap need the roomier size the cheat sheet uses. */}
      <Button variant="outline">
        <Kbd className="h-5 min-w-5 text-[11px]">u / ⌘z</Kbd>
        Undo
      </Button>
    </div>
  ),
}

export const Hidden: Story = {
  name: "Hints hidden",
  render: () => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        The same three controls with hints switched off — the caps render
        nothing at all, so the buttons keep their own spacing.
      </p>
      <KbdHintsContext.Provider value={false}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline">
            <Kbd>w</Kbd>
            Winner
          </Button>
          <Button variant="outline">
            <Kbd>e</Kbd>
            Error
          </Button>
          <Button variant="outline">
            <Kbd>k</Kbd>
            Stroke
          </Button>
        </div>
      </KbdHintsContext.Provider>
    </div>
  ),
}
