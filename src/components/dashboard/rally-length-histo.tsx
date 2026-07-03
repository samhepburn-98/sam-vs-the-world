import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import type { ChartConfig } from "@/components/ui/chart"
import type { RallyLengths } from "@/lib/schemas/insights"

// Rally-length distribution (§6.1): the three buckets as count bars, each
// annotated with its win rate — the grinder-vs-shotmaker read. Win rate is
// shown only where the bucket has rallies; the parent card gates the whole
// panel on sample (§3.5).

const BUCKETS = [
  { key: "short", label: "1–3" },
  { key: "medium", label: "4–8" },
  { key: "long", label: "9+" },
] as const

export interface HistoBucket {
  label: string
  rallies: number
  wins: number
  winRate: number | null
}

/** Pull the three buckets out of a rally_lengths row into chart rows. */
export function toHistoBuckets(lengths: RallyLengths): Array<HistoBucket> {
  return BUCKETS.map(({ key, label }) => {
    const rallies = lengths[`${key}_rallies`]
    const wins = lengths[`${key}_wins`]
    return {
      label,
      rallies,
      wins,
      winRate: rallies > 0 ? Math.round((wins / rallies) * 100) : null,
    }
  })
}

const config = {
  rallies: { label: "Rallies", color: "var(--chart-2)" },
} satisfies ChartConfig

export function RallyLengthHisto({ lengths }: { lengths: RallyLengths }) {
  const data = toHistoBuckets(lengths)

  return (
    <ChartContainer config={config} className="aspect-[3/1] w-full">
      <BarChart data={data} margin={{ top: 20 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis width={28} tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(_value, _name, item) => {
                const b = item.payload as HistoBucket
                return `${b.rallies} rallies · ${
                  b.winRate === null ? "—" : `${b.winRate}% won`
                }`
              }}
            />
          }
        />
        <Bar dataKey="rallies" fill="var(--color-rallies)" radius={[4, 4, 0, 0]}>
          <LabelList
            dataKey="winRate"
            position="top"
            className="fill-muted-foreground text-xs tabular-nums"
            formatter={(value) => (typeof value === "number" ? `${value}%` : "")}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
