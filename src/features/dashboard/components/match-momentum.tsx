import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { buildMatchLeadSeries } from "@/features/dashboard/lib/match-stats"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import type { ChartConfig } from "@/components/ui/chart"
import type { FoldedGame } from "@/features/dashboard/lib/fold-match"
import type { MatchLeadPoint } from "@/features/dashboard/lib/match-stats"

// The match-wide momentum worm (§5.2): every game's lead on one continuous
// axis, filled with p1's colour above the line and ink below — the same
// player identity the scoreboard dots and head-to-head bars use. Games are
// independent races, so each restarts from level after a gap.

const config = {
  lead: { label: "Lead" },
} satisfies ChartConfig

export function MatchMomentum({
  games,
  p1Name,
  p2Name,
}: {
  games: Array<FoldedGame>
  p1Name: string
  p2Name: string
}) {
  const { points, boundaries, ticks } = buildMatchLeadSeries(games)
  const leads = points
    .map((p) => p.lead)
    .filter((l): l is number => l !== null)
  if (points.length === 0 || leads.every((l) => l === 0)) {
    return (
      <p className="text-muted-foreground text-sm">
        Nothing to chart yet — log a few rallies first.
      </p>
    )
  }

  const max = Math.max(0, ...leads)
  const min = Math.min(0, ...leads)
  const span = max - min
  const off = span === 0 ? 0.5 : max / span

  const tooltipLabel = (item: MatchLeadPoint) =>
    item.rally === 0
      ? `Game ${item.gameNumber} start`
      : `Game ${item.gameNumber} · Rally ${item.rally}`
  const leadText = (lead: number) =>
    lead === 0
      ? "Level"
      : lead > 0
        ? `${p1Name} +${lead}`
        : `${p2Name} +${-lead}`

  return (
    <div className="relative">
      <ChartContainer
        config={config}
        className="aspect-[5/2] w-full sm:aspect-[3/1]"
        role="img"
        aria-label={`Lead over ${leads.length - games.length} rallies across ${games.length} ${games.length === 1 ? "game" : "games"}. Above the line ${p1Name} is ahead, below it ${p2Name} is.`}
      >
        <AreaChart
          data={points}
          margin={{ left: 4, right: 8, top: 8, bottom: 4 }}
        >
          <defs>
            <linearGradient id="match-momentum-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="var(--primary)" stopOpacity={0.45} />
              <stop
                offset={off}
                stopColor="var(--foreground)"
                stopOpacity={0.25}
              />
            </linearGradient>
            <linearGradient
              id="match-momentum-stroke"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset={off} stopColor="var(--primary)" />
              <stop offset={off} stopColor="var(--foreground)" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={games.length > 1 ? ticks.map((t) => t.x) : undefined}
            tickFormatter={(x: number) =>
              games.length > 1
                ? (ticks.find((t) => t.x === x)?.label ?? "")
                : String(x)
            }
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
          {boundaries.map((x) => (
            <ReferenceLine
              key={x}
              x={x}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
          ))}
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_label, items) =>
                  tooltipLabel(items[0].payload as MatchLeadPoint)
                }
                formatter={(value) => leadText(Number(value))}
              />
            }
          />
          <Area
            dataKey="lead"
            type="monotone"
            stroke="url(#match-momentum-stroke)"
            strokeWidth={1.5}
            fill="url(#match-momentum-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
      {/* the regions name themselves — no legend lookup (recognition, not recall) */}
      {max > 0 && (
        <span
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute top-2 left-10 text-[11px]"
        >
          {p1Name} ahead
        </span>
      )}
      {min < 0 && (
        <span
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute bottom-9 left-10 text-[11px]"
        >
          {p2Name} ahead
        </span>
      )}
    </div>
  )
}
