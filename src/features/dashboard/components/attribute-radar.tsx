import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"

// The hexagon radar under each player card: the six measured
// attributes as a shape, so the two players' styles read at a glance — a
// grinder bulges toward CON/GRD/CLU, a shotmaker toward SRV/ATT. Axes run
// clockwise from the top in attribute order. An unmeasured axis collapses
// to the centre rather than pretending to a value.

const CX = 80
const CY = 86
const R = 58
const LABEL_R = 72

function point(index: number, radius: number): [number, number] {
  const angle = ((index * 60 - 90) * Math.PI) / 180
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)]
}

function ring(radius: number): string {
  return Array.from({ length: 6 }, (_, i) =>
    point(i, radius)
      .map((v) => v.toFixed(1))
      .join(","),
  ).join(" ")
}

export function AttributeRadar({
  attrs,
  side,
  name,
}: {
  attrs: Array<PlayerAttribute>
  side: "p1" | "p2"
  name: string
}) {
  const color = side === "p1" ? "var(--primary)" : "var(--p2)"
  const shape = attrs
    .map((a, i) =>
      point(i, ((a.value ?? 0) / 100) * R)
        .map((v) => v.toFixed(1))
        .join(","),
    )
    .join(" ")

  return (
    <svg
      viewBox="0 0 160 172"
      role="img"
      aria-label={`${name}'s attribute radar: ${attrs
        .map((a) => `${a.code} ${a.display}`)
        .join(", ")}`}
      className="w-full"
    >
      <polygon
        points={ring(R)}
        fill="none"
        className="stroke-muted-foreground/30"
        strokeWidth={0.8}
      />
      <polygon
        points={ring(R / 2)}
        fill="none"
        className="stroke-muted-foreground/20"
        strokeWidth={0.8}
      />
      <polygon
        points={shape}
        fill={color}
        fillOpacity={0.32}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {attrs.map((a, i) => {
        const [x, y] = point(i, LABEL_R)
        return (
          <text
            key={a.key}
            x={x.toFixed(1)}
            y={(y + 3).toFixed(1)}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px] font-medium"
          >
            {a.code}
          </text>
        )
      })}
    </svg>
  )
}
