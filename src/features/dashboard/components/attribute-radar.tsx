import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"

// The hexagon radar under each player card: the six measured attributes as
// a shape, so the two players' styles read at a glance — a grinder bulges
// toward CON/GRD/CLU, a shotmaker toward SRV/ATT. An unmeasured axis
// collapses to the centre (null → 0) rather than pretending to a value.
//
// Drawn with recharts, with two hard-won constraints:
// 1. Sized via CSS on the chart itself — recharts 3 is natively responsive.
//    Do NOT wrap in ChartContainer/ResponsiveContainer: in this compact
//    square column (and under SSR) ResponsiveContainer measures 0×0 and
//    draws nothing.
// 2. Style via recharts props, never Tailwind fill-*/stroke-* classes —
//    fill/stroke set by CSS override recharts' own fill="none" attributes
//    (a class on PolarAngleAxis paints its axis polygon solid).

const SIDE_COLOR = {
  p1: "var(--primary)",
  p2: "var(--p2)",
} as const

/** The rows the radar draws — an unmeasured attribute (null) collapses to
 *  the centre (0) rather than pretending to a value. */
export function toRadarData(attrs: Array<PlayerAttribute>) {
  return attrs.map((a) => ({ code: a.code, value: a.value ?? 0 }))
}

/** The radar as a screen reader hears it: each code with its display
 *  value, dashes included — the same six numbers the sighted eye reads. */
export function radarLabel(name: string, attrs: Array<PlayerAttribute>) {
  return `${name}'s attribute radar: ${attrs
    .map((a) => `${a.code} ${a.display}`)
    .join(", ")}`
}

export function AttributeRadar({
  attrs,
  side,
  name,
}: {
  /** the six attributes, in axis order (clockwise from the top) */
  attrs: Array<PlayerAttribute>
  /** which duel corner the player occupies — sets the shape's colour */
  side: "p1" | "p2"
  /** player name, for the accessible label */
  name: string
}) {
  const color = SIDE_COLOR[side]
  const data = toRadarData(attrs)

  return (
    <div
      // overflow-visible: at compact sizes the axis labels extend past the
      // svg edge; let them spill into the column gap instead of clipping
      className="mx-auto [&_svg]:overflow-visible"
      role="img"
      aria-label={radarLabel(name, attrs)}
    >
      <RadarChart
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "500px",
          maxHeight: "80vh",
          aspectRatio: 1,
        }}
        data={data}
      >
        <PolarGrid stroke="var(--muted-foreground)" strokeOpacity={0.3} />
        <PolarAngleAxis
          dataKey="code"
          axisLine={false}
          tick={{
            fill: "var(--muted-foreground)",
            fontSize: 16,
            fontWeight: 500,
          }}
        />
        {/* clamp to the same 0–100 scale as the card grid, not auto-fitted
            to each player's max */}
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.32}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </RadarChart>
    </div>
  )
}
