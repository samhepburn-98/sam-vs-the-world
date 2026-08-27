import { Separator } from "@/components/ui/separator"

import type { Meta, StoryObj } from "@storybook/react-vite"

// A one-pixel rule in the border tone. Both places the app rules a line wrap
// it already — FieldSeparator for the break in a form, ItemSeparator between
// list rows — so reach for it raw only for a divide those two do not cover,
// such as splitting a stat panel into sections. Horizontal by default;
// vertical needs a flex parent to stretch against. Decorative by default, so
// screen readers skip it — pass `decorative={false}` only when the rule is
// the sole thing marking a real change of subject.

const meta = {
  title: "Primitives/Separator",
  component: Separator,
  args: { orientation: "horizontal" },
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-3 text-sm">
      <div>
        <p className="font-medium">Serve</p>
        <p className="text-muted-foreground">58% of points won, 154 of 266.</p>
      </div>
      <Separator {...args} />
      <div>
        <p className="font-medium">Return</p>
        <p className="text-muted-foreground">36% of points won, 96 of 266.</p>
      </div>
    </div>
  ),
}

// Between fragments on one line — the parent sets the height the rule
// stretches to, so it never collapses to nothing.
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-5 items-center gap-3 text-sm text-muted-foreground">
      <span>Sam</span>
      <Separator {...args} />
      <span>Right-handed</span>
      <Separator {...args} />
      <span className="tabular-nums">24 matches</span>
    </div>
  ),
}
