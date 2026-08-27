import { Glossary } from "@/features/logger/components/glossary"

import type { Meta, StoryObj } from "@storybook/react-vite"

// What every chip in the logger actually means, in one screen: how a rally
// ended, which wall an error found, and the three calls people get wrong
// (forced, shot, shots). Reach for it beside any surface that logs a rally —
// its error-detail lines are the very record the outcome chips hover-read
// (ERROR_DETAIL_HELP), so that half of the sheet can't drift from the buttons.
// Pinned open here; in the app the logging shell owns whether it is showing.

const meta = {
  title: "Logger/Glossary",
  component: Glossary,
  args: { open: true, onClose: () => undefined },
} satisfies Meta<typeof Glossary>

export default meta
type Story = StoryObj<typeof meta>

// Ace is deliberately missing from the list: there is no ace button, because
// an ace is a winner on a one-shot rally and gets counted, not clicked. The
// closing note says so, next to the two optional tags nobody has to fill in.
export const Default: Story = {}
