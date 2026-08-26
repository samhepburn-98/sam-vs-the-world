import { useState } from "react"

import { WinnerButtons } from "@/features/logger/components/winner-buttons"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "Logger/Winner buttons",
  component: WinnerButtons,
  args: {
    p1Name: "Sam",
    p2Name: "Ormond",
    selected: null,
    onWinner: () => undefined,
    onLet: () => undefined,
  },
} satisfies Meta<typeof WinnerButtons>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="w-96">
      <WinnerButtons {...args} />
    </div>
  ),
}

export const Interactive: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<"p1" | "p2" | null>(null)
    return (
      <div className="w-96">
        <WinnerButtons {...args} selected={selected} onWinner={setSelected} />
      </div>
    )
  },
}
