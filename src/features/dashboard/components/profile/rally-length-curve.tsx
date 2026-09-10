import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import type { ChartConfig } from "@/components/ui/chart"
import type { CurveBucket } from "@/features/dashboard/lib/profile-types"

// Win rate against rally length — the archetype curve. A shotmaker's line
// starts high and sags past nine shots; a grinder's climbs. The dashed 50%
// line makes break-even visible, and the area fill under the curve keeps the
// shape readable at a glance. A bucket with no rallies plots no point (its
// win rate is null) but still labels its slot on the axis, so the length
// scale stays honest even when the middle is empty.

const config = {
  winRate: { label: "Win rate", color: "var(--primary)" },
} satisfies ChartConfig

export function RallyLengthCurve({ buckets }: { buckets: Array<CurveBucket> }) {
  const plotted = buckets.filter((b) => b.winRate !== null)

  if (plotted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Not enough rallies logged yet.
      </p>
    )
  }

  return (
    <ChartContainer
      config={config}
      className="aspect-[3/1] w-full"
      role="img"
      aria-label={`Win rate by rally length: ${buckets
        .map((b) =>
          b.winRate === null
            ? `no rallies at ${b.label}`
            : `${b.winRate}% at ${b.label}`
        )
        .join(", ")}.`}
    >
      <AreaChart
        data={buckets}
        margin={{ left: 4, right: 8, top: 20, bottom: 4 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          domain={[0, 100]}
          width={40}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <ReferenceLine y={50} stroke="var(--border)" strokeDasharray="4 5" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="winRate"
          type="linear"
          connectNulls
          stroke="var(--color-winRate)"
          strokeWidth={2.5}
          fill="var(--color-winRate)"
          fillOpacity={0.1}
          dot={{ r: 4, fill: "var(--color-winRate)", strokeWidth: 0 }}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="winRate"
            position="top"
            offset={10}
            formatter={(v) => (typeof v === "number" ? `${v}%` : "")}
            className="fill-foreground font-semibold tabular-nums"
            fontSize={11}
          />
        </Area>
      </AreaChart>
    </ChartContainer>
  )
}
