import { FormGuide } from "@/components/form-guide"
import { ResultChip } from "@/components/result-chip"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Result chip",
  component: ResultChip,
  args: { result: "w" },
} satisfies Meta<typeof ResultChip>

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ResultChip result="w" />
      <ResultChip result="d" />
      <ResultChip result="l" />
    </div>
  ),
}

export const AsFormGuide: Story = {
  render: () => <FormGuide results={["l", "w", "d", "l", "l"]} />,
}
