import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import type { ChartConfig } from "@/components/ui/chart"
import type { RallyScored } from "@/lib/schemas/rally"

// One game's score race (§5.2): a line per player of their running score over
// the rallies. Every rally is on the x-axis — a let holds both scores, so its
// segment is flat. Fed the folded rallies_scored rows the match page already
// has.

export function GameScoreChart({
  rows,
  p1Name,
  p2Name,
}: {
  rows: Array<RallyScored>
  p1Name: string
  p2Name: string
}) {
  const data = rows.map((r) => ({
    rally: r.rally_number,
    p1: r.score_p1,
    p2: r.score_p2,
  }))

  // orange accent vs neutral ink — different hues, so the two lines separate
  // clearly (the chart ramp is all reds, which read as one colour). Both
  // adapt to light/dark via theme tokens.
  const config = {
    p1: { label: p1Name, color: "var(--primary)" },
    p2: { label: p2Name, color: "var(--foreground)" },
  } satisfies ChartConfig

  return (
    <ChartContainer config={config} className="aspect-[3/1] w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="rally"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis width={28} tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              // the numeric axis label confuses the default header, so read
              // the rally straight off the hovered data point
              labelFormatter={(_label, items) =>
                // labelFormatter only runs with a non-empty payload
                `Rally ${(items[0].payload as { rally?: number }).rally ?? ""}`
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="p1"
          type="linear"
          stroke="var(--color-p1)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          dataKey="p2"
          type="linear"
          stroke="var(--color-p2)"
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
