import { useId } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { ChartContainer, ChartTooltip } from "@/components/ui/chart"

import type { ChartConfig } from "@/components/ui/chart"
import type { RallyScored } from "@/lib/schemas/rally"

// The signature diverging momentum area (§4.5): one game's lead over its
// rallies, filled above the line when the player is ahead and below when
// behind. Fed either from the momentum RPC's comeback rallies or from the
// rallies_scored rows already on hand in the logger / match detail — both
// are the same shape, so there's one implementation.

export interface LeadPoint {
  rally: number
  lead: number
}

/** Lead (player − opponent) after each rally of a single game, in order. */
export function computeLeadSeries(
  rallies: Array<RallyScored>,
  playerId: string
): Array<LeadPoint> {
  return rallies
    .slice()
    .sort((a, b) => a.rally_number - b.rally_number)
    .map((r) => {
      const isP1 = r.player1_id === playerId
      const lead = isP1 ? r.score_p1 - r.score_p2 : r.score_p2 - r.score_p1
      return { rally: r.rally_number, lead }
    })
}

/** The 0–1 offset where the fill flips colour — the zero line's position in
 *  the value range, so "ahead" always takes the ember and "behind" the muted
 *  tone. Two stops share the offset, so the fill cuts at the line rather
 *  than ramping across it. */
export function zeroOffset(series: Array<LeadPoint>): number {
  const leads = series.map((s) => s.lead)
  const max = Math.max(0, ...leads)
  const min = Math.min(0, ...leads)
  const span = max - min
  return span === 0 ? 0.5 : max / span
}

const config = {
  lead: { label: "Lead", color: "var(--chart-3)" },
} satisfies ChartConfig

export function MomentumChart({
  rallies,
  playerId,
}: {
  rallies: Array<RallyScored>
  playerId: string
}) {
  return <MomentumArea data={computeLeadSeries(rallies, playerId)} />
}

/** The presentational diverging area, given a precomputed lead series — so a
 *  caller that already has the lead (e.g. match detail, folding rallies
 *  client-side) can draw it without a RallyScored shape. */
export function MomentumArea({ data }: { data: Array<LeadPoint> }) {
  // The gradient's flip offset is data-dependent, so the id must be unique
  // per instance — the category page renders one of these per game.
  const fillId = useId()
  const off = zeroOffset(data)
  const endLead = data.at(-1)?.lead ?? 0
  const ending =
    endLead > 0
      ? `ahead by ${endLead}`
      : endLead < 0
        ? `behind by ${Math.abs(endLead)}`
        : "level"

  return (
    <ChartContainer
      config={config}
      className="aspect-[3/1] w-full"
      role="img"
      aria-label={`Momentum over ${data.length} rallies, ending ${ending}.`}
    >
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset={off} stopColor="var(--chart-3)" stopOpacity={0.5} />
            <stop
              offset={off}
              stopColor="var(--muted-foreground)"
              stopOpacity={0.35}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="rally"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          width={28}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <ReferenceLine y={0} stroke="var(--border)" />
        <ChartTooltip />
        <Area
          dataKey="lead"
          type="monotone"
          stroke="var(--color-lead)"
          strokeWidth={1.5}
          fill={`url(#${fillId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
