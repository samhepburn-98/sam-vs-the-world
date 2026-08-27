import { FormGuide } from "@/components/broadcast/form-guide"

import { ALEX, ORMOND, SAM } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

// The football-style form strip: recent results as chips, oldest first, newest
// on the right. Reach for it on any row that names a player when "how are they
// going right now?" beats a career total. Hand it the whole history — it keeps
// the last five — and it renders nothing at all for a player with no matches.

type Results = ComponentProps<typeof FormGuide>["results"]

const meta = {
  title: "Broadcast/Form guide",
  component: FormGuide,
  args: { results: ["l", "w", "d", "l", "w"] },
} satisfies Meta<typeof FormGuide>

export default meta
type Story = StoryObj<typeof meta>

// The strip's real home: a name on the left, the run of play on the right.
function PlayerRow({ name, results }: { name: string; results: Results }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-card px-3 py-2">
      <span className="font-heading text-lg leading-none font-extrabold uppercase">
        {name}
      </span>
      <FormGuide results={results} />
    </div>
  )
}

export const Default: Story = {}

// Twelve results in, five out — the caller never has to slice the history
// itself, so a player page can pass whatever the query returned.
export const OnlyTheLastFive: Story = {
  name: "Only the last five",
  args: {
    results: ["w", "w", "l", "d", "w", "l", "l", "w", "d", "l", "l", "w"],
  },
}

// Fewer than five is not padded out with blanks: two matches means two chips,
// and the row it sits in has to tolerate a short strip.
export const EarlyDays: Story = {
  name: "Early days",
  args: { results: ["w", "l"] },
}

// A player with no matches gets no strip at all rather than an empty shell,
// so the row holding it needs to read correctly with the space simply gone.
export const NoMatchesYet: Story = {
  name: "No matches yet",
  args: { results: [] },
  render: (args) => (
    <div className="w-64">
      <PlayerRow name={SAM.name} results={args.results} />
    </div>
  ),
}

// Stacked, the strips become a comparison: Alex is running hot, Ormond is not.
export const AcrossTheRoster: Story = {
  name: "Across the roster",
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <PlayerRow name={SAM.name} results={["l", "w", "d", "l", "w"]} />
      <PlayerRow name={ALEX.name} results={["w", "w", "l", "w", "w"]} />
      <PlayerRow name={ORMOND.name} results={["d", "l", "l", "w", "l"]} />
    </div>
  ),
}
