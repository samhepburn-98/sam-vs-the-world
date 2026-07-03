import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { MIN_MATCHES_FOR_TREND } from "@/lib/insight-thresholds"

import type { ChartConfig } from "@/components/ui/chart"

// Win rate over time (§6.1). Under the trend threshold (§3.5) it plots bare
// points — a line between two matches would imply a direction the data can't
// support.

export interface TrendPoint {
  /** ISO date, used as the x label. */
  date: string
  /** Win rate 0–100 at that point. */
  winRate: number
}

/** A connecting line is only drawn once there are enough points to imply a
 *  direction; below that the same series shows as bare dots. */
export function shouldPlotLine(points: number): boolean {
  return points >= MIN_MATCHES_FOR_TREND
}

const config = {
  winRate: { label: "Win rate", color: "var(--chart-3)" },
} satisfies ChartConfig

export function WinRateTrend({ data }: { data: Array<TrendPoint> }) {
  const line = shouldPlotLine(data.length)

  return (
    <ChartContainer config={config} className="aspect-[3/1] w-full">
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(d: string) => d.slice(5)} // MM-DD
        />
        <YAxis
          domain={[0, 100]}
          width={32}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v}%`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="winRate"
          type="monotone"
          stroke="var(--color-winRate)"
          strokeWidth={1.5}
          strokeOpacity={line ? 1 : 0}
          dot={{ r: 3, fill: "var(--color-winRate)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
