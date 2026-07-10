import type { CurveBucket } from "@/features/dashboard/lib/profile-fixture"

// Win rate against rally length — the archetype curve. A shotmaker's line
// starts high and sags past ten shots; a grinder's climbs. The dashed 50%
// line makes break-even visible, and the area fill under the curve keeps
// the shape readable at a glance. Geometry is computed from the buckets so
// the component doesn't care how many there are.

const W = 560
const H = 170
const PAD_X = 50
const BASE_Y = 155
const LABEL_Y = 166

/** Map a win rate (30–80 window) onto the drawable band. */
function y(rate: number): number {
  return BASE_Y - (rate - 30) * 2.8
}

export function RallyLengthCurve({ buckets }: { buckets: Array<CurveBucket> }) {
  const step = (W - PAD_X * 2) / (buckets.length - 1)
  const points = buckets.map((b, i) => ({
    x: PAD_X + i * step,
    y: y(b.winRate),
    ...b,
  }))
  const line = points.map((p) => `${p.x},${p.y.toFixed(1)}`).join(" ")
  const area = `M ${line.replaceAll(" ", " L ")} L ${points.at(-1)?.x},${BASE_Y} L ${points[0].x},${BASE_Y} Z`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Win rate by rally length: ${buckets
        .map((b) => `${b.winRate}% at ${b.label}`)
        .join(", ")}.`}
      className="w-full"
    >
      <line
        x1={PAD_X - 10}
        y1={y(50)}
        x2={W - PAD_X + 10}
        y2={y(50)}
        className="stroke-border"
        strokeDasharray="4 5"
      />
      <text
        x={PAD_X - 16}
        y={y(50) + 4}
        textAnchor="end"
        className="fill-muted-foreground text-[10.5px]"
      >
        50%
      </text>

      <path d={area} className="fill-primary/10" />
      <polyline
        points={line}
        className="fill-none stroke-primary"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="4" className="fill-primary" />
          <text
            x={p.x}
            y={p.winRate >= 50 ? p.y - 12 : p.y + 20}
            textAnchor="middle"
            className="fill-foreground text-[11px] font-semibold tabular-nums"
          >
            {p.winRate}%
          </text>
          <text
            x={p.x}
            y={LABEL_Y}
            textAnchor="middle"
            className="fill-muted-foreground text-[10.5px] tabular-nums"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
