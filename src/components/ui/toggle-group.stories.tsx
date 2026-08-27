import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import type { Meta, StoryObj } from "@storybook/react-vite"

// A row of chips where the whole set is one control — radio semantics and
// arrow-key focus, not a handful of buttons with hand-managed pressed state.
// This is the app's default for a short list of known values: the ball
// filter, the logger's outcome and error-detail rows.

const meta = {
  title: "Primitives/Toggle group",
  component: ToggleGroup,
  args: { type: "single", variant: "outline", defaultValue: "double_yellow" },
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

// The ball filter's shape. The values are the raw `ball_type` enum members
// and only the labels are written for people — the real filter bar goes one
// further and swaps the labels for BallDots glyphs.
const BALLS = [
  { value: "blue", label: "Blue" },
  { value: "red", label: "Red" },
  { value: "yellow", label: "Yellow" },
  { value: "double_yellow", label: "Double yellow" },
]

export const Default: Story = {
  render: (args) => (
    <ToggleGroup {...args} aria-label="Ball">
      {BALLS.map((ball) => (
        <ToggleGroupItem key={ball.value} value={ball.value}>
          {ball.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  ),
}

// `spacing={0}` fuses the chips into one segmented control: shared borders,
// rounded ends only. Reach for it when the options are a single dimension of
// the same thing — a scope, a span — rather than independent filters.
export const Joined: Story = {
  render: () => (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      defaultValue="all"
      aria-label="Span"
    >
      <ToggleGroupItem value="all">All time</ToggleGroupItem>
      <ToggleGroupItem value="last_10">Last 10</ToggleGroupItem>
      <ToggleGroupItem value="last_match">Last match</ToggleGroupItem>
    </ToggleGroup>
  ),
}

// `type="multiple"` drops the one-answer rule: every chip is its own on/off,
// and the value is an array. Nothing selected is a legitimate state — an
// empty outcome filter means every outcome, not none.
export const Multiple: Story = {
  render: () => (
    <ToggleGroup
      type="multiple"
      variant="outline"
      size="sm"
      defaultValue={["winner", "error"]}
      aria-label="Outcomes"
    >
      <ToggleGroupItem value="winner">Winner</ToggleGroupItem>
      <ToggleGroupItem value="error">Error</ToggleGroupItem>
      <ToggleGroupItem value="stroke">Stroke</ToggleGroupItem>
      <ToggleGroupItem value="let">Let</ToggleGroupItem>
    </ToggleGroup>
  ),
}

// Vertical: the items stretch to a common width, which reads as a list of
// choices rather than a strip of filters.
export const Vertical: Story = {
  render: () => (
    <ToggleGroup
      type="single"
      variant="outline"
      orientation="vertical"
      defaultValue="tin"
      aria-label="Where the error went"
    >
      <ToggleGroupItem value="tin">Tin</ToggleGroupItem>
      <ToggleGroupItem value="out_top">Out top</ToggleGroupItem>
      <ToggleGroupItem value="out_side">Out side</ToggleGroupItem>
      <ToggleGroupItem value="not_up">Not up</ToggleGroupItem>
    </ToggleGroup>
  ),
}
