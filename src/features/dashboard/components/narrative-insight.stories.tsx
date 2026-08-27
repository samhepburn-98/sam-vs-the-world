import { NarrativeInsight } from "@/features/dashboard/components/narrative-insight"

import type { ProfileInsight } from "@/features/dashboard/lib/profile-types"
import type { Meta, StoryObj } from "@storybook/react-vite"

// A computed insight rendered as a broadcast callout: eyebrow as the kicker,
// thesis in bold, the numbers that earned it in the body. Reach for it beside
// any chart on the Summary tab — the graphic shows the shape, this says what
// the shape means, so the chart never has to explain itself.

const STRENGTH: ProfileInsight = {
  eyebrow: "Strength",
  title: "The serve is the weapon.",
  body: "58% of points won behind your own serve — 58 of 100 serve rallies. The point starts on your terms.",
  highlight: true,
}

const WEAKNESS: ProfileInsight = {
  eyebrow: "Weakness",
  title: "The return game leaks.",
  body: "Just 47% of points won when receiving — 47 of 100 return rallies. An 11-point gap off the serve number, and the biggest single number to move.",
}

const PATTERN: ProfileInsight = {
  eyebrow: "Pattern",
  title: "The tighter it gets, the better it goes.",
  body: "52% of points won early in a game against 64% from 9–all — a 12-point climb as the game closes out.",
}

const meta = {
  title: "Dashboard/Narrative insight",
  component: NarrativeInsight,
  args: { insight: STRENGTH },
  render: (args) => (
    <div className="w-80">
      <NarrativeInsight {...args} />
    </div>
  ),
} satisfies Meta<typeof NarrativeInsight>

export default meta
type Story = StoryObj<typeof meta>

// The highlighted member of a group: `highlight` paints the ember bar, and
// nothing else about the callout changes.
export const Highlighted: Story = {}

// The group the Summary tab draws beside each visual: strength, weakness,
// pattern. Only one insight in a group carries `highlight` — the ember bar
// marks the one worth acting on, so a column of three ember bars would say
// nothing at all.
export const InsightGroup: Story = {
  name: "Insight group",
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <NarrativeInsight insight={STRENGTH} />
      <NarrativeInsight insight={WEAKNESS} />
      <NarrativeInsight insight={PATTERN} />
    </div>
  ),
}

// The honesty gate. With too few rated attributes to compare, the computed
// insight says so in the same shape rather than dressing up a thin number.
export const TooEarlyToCall: Story = {
  name: "Too early to call",
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <NarrativeInsight
        insight={{
          eyebrow: "Strength",
          title: "Too early to call.",
          body: "No attribute has enough rallies behind it to name a strength yet — the radar fills in as more play is logged.",
          highlight: true,
        }}
      />
      <NarrativeInsight
        insight={{
          eyebrow: "Weakness",
          title: "Too early to call.",
          body: "A weakness needs at least two rated attributes to compare. Keep logging.",
        }}
      />
    </div>
  ),
}
