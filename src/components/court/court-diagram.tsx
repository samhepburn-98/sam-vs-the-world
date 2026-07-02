import { cn } from "@/lib/utils"

// Squash court floor plan, drawn to real proportions (6.4m × 9.75m).
// Strokes inherit `currentColor`; optional service-box shading uses the
// theme primary so the same mark works as wordmark, serve-stat visual,
// and empty-state art (§4.6).
const COURT = { w: 640, h: 975, shortLine: 544, boxSize: 160 } as const

interface CourtDiagramProps {
  className?: string
  /** 0–1 shading intensity for the left service box */
  leftShare?: number
  /** 0–1 shading intensity for the right service box */
  rightShare?: number
  label?: string
}

function boxOpacity(share: number | undefined) {
  if (share === undefined || Number.isNaN(share)) return 0
  return 0.15 + Math.max(0, Math.min(1, share)) * 0.65
}

export function CourtDiagram({
  className,
  leftShare,
  rightShare,
  label = "Squash court",
}: CourtDiagramProps) {
  const { w, h, shortLine, boxSize } = COURT
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      className={cn("text-foreground", className)}
      fill="none"
    >
      <title>{label}</title>
      {leftShare !== undefined && (
        <rect
          x={0}
          y={shortLine}
          width={boxSize}
          height={boxSize}
          className="fill-primary"
          fillOpacity={boxOpacity(leftShare)}
        />
      )}
      {rightShare !== undefined && (
        <rect
          x={w - boxSize}
          y={shortLine}
          width={boxSize}
          height={boxSize}
          className="fill-primary"
          fillOpacity={boxOpacity(rightShare)}
        />
      )}
      <g stroke="currentColor" strokeWidth={28} vectorEffect="non-scaling-stroke">
        <rect x={14} y={14} width={w - 28} height={h - 28} rx={8} />
        <line x1={0} y1={shortLine} x2={w} y2={shortLine} />
        <line x1={w / 2} y1={shortLine} x2={w / 2} y2={h - 14} />
        <path d={`M ${boxSize} ${shortLine} v ${boxSize} h -${boxSize - 14}`} />
        <path d={`M ${w - boxSize} ${shortLine} v ${boxSize} h ${boxSize - 14}`} />
      </g>
    </svg>
  )
}
