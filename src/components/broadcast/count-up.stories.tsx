import { CountUp } from "@/components/broadcast/count-up"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The one stat-reveal flourish: a number that runs up from zero on mount, in
// 650ms unless `durationMs` says otherwise. Reach for it for a figure the eye
// is meant to land on — a hero stat, the total at the head of a summary line
// — and never for one in a table, where a column of numbers all counting at
// once is noise. An invisible sizer holds the final width so nothing beside
// it shifts, and reduced-motion readers get the value outright.

const meta = {
  title: "Broadcast/Count up",
  component: CountUp,
  args: { value: 58, suffix: "%" },
} satisfies Meta<typeof CountUp>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <span className="font-heading text-3xl font-bold">
      <CountUp {...args} />
    </span>
  ),
}

// Decimals have to be declared, not inferred: the intermediate frames format
// to the same places, so a rally average set to 0 would flicker whole numbers
// all the way up and land on 5.
export const Decimals: Story = {
  args: { value: 5.4, decimals: 1, suffix: "" },
  render: (args) => (
    <p className="flex items-baseline gap-1.5">
      <span className="font-heading text-3xl font-bold">
        <CountUp {...args} />
      </span>
      <span className="text-sm text-muted-foreground">Shots per rally</span>
    </p>
  ),
}

// The sizer earns its keep in running text, where a number that grew from one
// digit to four would drag the rest of the sentence along behind it.
export const InASentence: Story = {
  render: () => (
    <div className="max-w-md space-y-2">
      <p className="text-sm text-muted-foreground">
        <CountUp value={2417} /> rallies logged across <CountUp value={31} />{" "}
        matches.
      </p>
      <p className="text-xs text-muted-foreground/70">
        The width is reserved up front, so the words after each number never
        jump as its digits arrive.
      </p>
    </div>
  ),
}
