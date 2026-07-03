import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import type { ChartConfig } from "@/components/ui/chart"
import type { ErrorProfile } from "@/features/dashboard/schemas/insights"

// Error breakdown (§6.1): a stacked bar of where the errors go (the detail
// taxonomy) and a second of why (the forced three-way). The red ramp carries
// the shot-error types; neutrals carry the "off the back/side" and untagged
// buckets so the eye reads the tin/front-wall errors first.

const TYPE_CONFIG = {
  tin: { label: "Tin", color: "var(--chart-5)" },
  out_top: { label: "Out (top)", color: "var(--chart-4)" },
  not_up: { label: "Not up", color: "var(--chart-3)" },
  out_side: { label: "Out (side)", color: "var(--chart-2)" },
  out_back: { label: "Out (back)", color: "var(--chart-1)" },
  double_bounce: { label: "Double bounce", color: "var(--muted-foreground)" },
  detail_untagged: { label: "Untagged", color: "var(--muted)" },
} satisfies ChartConfig

const CAUSE_CONFIG = {
  unforced_errors: { label: "Unforced", color: "var(--chart-4)" },
  forced_errors: { label: "Forced", color: "var(--chart-2)" },
  untagged_errors: { label: "Untagged", color: "var(--muted)" },
} satisfies ChartConfig

/** The detail split as the single stacked row a horizontal bar wants. */
export function toErrorTypeData(profile: ErrorProfile) {
  return [
    {
      row: "type",
      tin: profile.tin,
      out_top: profile.out_top,
      not_up: profile.not_up,
      out_side: profile.out_side,
      out_back: profile.out_back,
      double_bounce: profile.double_bounce,
      detail_untagged: profile.detail_untagged,
    },
  ]
}

/** The forced three-way — untagged kept its own segment, never folded in. */
export function toErrorCauseData(profile: ErrorProfile) {
  return [
    {
      row: "cause",
      unforced_errors: profile.unforced_errors,
      forced_errors: profile.forced_errors,
      untagged_errors: profile.untagged_errors,
    },
  ]
}

function StackedRow<TConfig extends ChartConfig>({
  config,
  data,
}: {
  config: TConfig
  data: Array<Record<string, number | string>>
}) {
  const keys = Object.keys(config)
  return (
    <ChartContainer config={config} className="aspect-[5/1] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="row" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="a"
            fill={`var(--color-${key})`}
            radius={
              i === 0
                ? [4, 0, 0, 4]
                : i === keys.length - 1
                  ? [0, 4, 4, 0]
                  : 0
            }
          />
        ))}
      </BarChart>
    </ChartContainer>
  )
}

export function ErrorBreakdown({ profile }: { profile: ErrorProfile }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-muted-foreground mb-2 text-sm font-medium">By type</p>
        <StackedRow config={TYPE_CONFIG} data={toErrorTypeData(profile)} />
      </div>
      <div>
        <p className="text-muted-foreground mb-2 text-sm font-medium">By cause</p>
        <StackedRow config={CAUSE_CONFIG} data={toErrorCauseData(profile)} />
      </div>
    </div>
  )
}
