import { Plaque } from "@/components/plaque"

import type { Meta, StoryObj } from "@storybook/react-vite"

const meta = {
  title: "UI/Plaque",
  component: Plaque,
  args: { children: "Earned" },
} satisfies Meta<typeof Plaque>

export default meta
type Story = StoryObj<typeof meta>

export const Verdict: Story = {
  render: () => (
    <Plaque className="w-72" innerClassName="py-4 text-center">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
        On the stats
      </p>
      <p className="mt-1.5 font-heading text-3xl leading-tight text-gold uppercase">
        Ormond
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        takes it 4–2 across the six
      </p>
    </Plaque>
  ),
}

export const PlayerTwoTone: Story = {
  render: () => (
    <Plaque tone="p2" className="w-72" innerClassName="py-4 text-center">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
        Head to head
      </p>
      <p className="mt-1.5 font-heading text-3xl leading-tight text-p2-strong">
        7–5
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">games this season</p>
    </Plaque>
  ),
}
