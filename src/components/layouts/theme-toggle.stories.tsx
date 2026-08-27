import { ThemeToggle } from "@/components/layouts/theme-toggle"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The day/night switch: a ghost icon button that flips the resolved theme and
// remembers the choice. The site header already carries the only two copies
// the app needs, so a page should never add its own — to change the theme from
// anywhere else, call setThemePref from lib/theme instead. It takes no props
// and needs no provider, and it shows a stable icon until it has mounted, so
// there is no hydration flash. It works for real in here: clicking repaints
// the canvas, and the toolbar's Theme control puts it back.

const meta = {
  title: "Layouts/Theme toggle",
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>

export default meta
type Story = StoryObj<typeof meta>

// How it sits at the end of the desktop nav row: icon only, no label.
export const Default: Story = {}

// The mobile sheet gives it a label instead — on its own in a list of words, a
// moon does not explain itself.
export const LabelledRow: Story = {
  render: () => (
    <div className="flex w-64 items-center justify-between px-2 py-1">
      <span className="font-heading text-sm font-bold tracking-[0.1em] text-muted-foreground uppercase">
        Theme
      </span>
      <ThemeToggle />
    </div>
  ),
}
