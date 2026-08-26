import { Atmosphere } from "@/components/atmosphere"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Atmosphere",
  component: Atmosphere,
} satisfies Meta<typeof Atmosphere>

export default meta
type Story = StoryObj<typeof meta>

function Screen({ tone }: { tone: "solo" | "duel" }) {
  return (
    <div className="relative h-96 w-72 overflow-hidden rounded-xl ring-1 ring-border">
      <Atmosphere tone={tone} className="h-full" />
      <p className="p-4 text-xs text-muted-foreground">
        {tone === "duel"
          ? "The head-to-head split: ember left, blue right."
          : "One per screen, always behind everything."}
      </p>
    </div>
  )
}

export const Solo: Story = {
  render: () => <Screen tone="solo" />,
}

export const Duel: Story = {
  render: () => <Screen tone="duel" />,
}
