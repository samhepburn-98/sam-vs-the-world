import { Textarea } from "@/components/ui/textarea"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The long-form control — in practice, the notes field in the Manage edit
// dialog. It sizes to its own content rather than scrolling inside a fixed
// box, so a three-line note is three lines tall and never hides its own tail.
// It never resizes by hand: the drag handle is off, height is the content's.

const meta = {
  title: "Primitives/Textarea",
  component: Textarea,
  args: {
    rows: 3,
    placeholder: "Anything worth remembering about the match.",
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Filled: Story = {
  args: {
    defaultValue:
      "Second game on the new double yellow — the ball never warmed up and every drop died short. Alex played the front court all night and I kept feeding it.",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Ormond took the third off me on the tin, twice.",
  },
}
