import { biggestZone } from "@/features/dashboard/lib/profile-errors"
import { cn } from "@/lib/utils"

import type { ErrorWallCounts } from "@/features/dashboard/lib/profile-errors"

// The error wall: the court as the player sees it from the back — the front
// wall in elevation, the floor running back toward the viewer, and the strip
// past the bottom edge standing in for the space behind them. Every way of
// giving a point away is drawn where it happens: the tin band and out line
// on the wall, the side-wall columns, not-up on the floor it died on,
// out-back beyond the back line. The loud treatment (deep fill, bold share
// label, scatter of balls) follows whichever zone actually leads — the
// biggest leak is different for every player.

type ZoneKey = keyof ErrorWallCounts

/** Decorative ball positions per zone, drawn only on the leading zone. */
const ZONE_DOTS: Record<ZoneKey, Array<[number, number]>> = {
  outTop: [
    [320, 40],
    [372, 54],
    [410, 38],
    [452, 50],
    [492, 42],
  ],
  outSide: [
    [52, 110],
    [54, 168],
    [626, 96],
    [628, 204],
  ],
  tin: [
    [470, 244],
    [502, 256],
    [524, 248],
    [548, 259],
    [566, 244],
    [588, 253],
    [609, 247],
  ],
  // the floor label sits centred around y≈336 — the scatter stays above
  // and below it so the two never collide
  notUp: [
    [210, 300],
    [330, 306],
    [452, 298],
    [560, 304],
    [172, 360],
    [340, 366],
    [516, 358],
  ],
  outBack: [
    [232, 392],
    [290, 402],
    [346, 394],
    [404, 404],
    [458, 396],
  ],
}

export function ErrorWall({ wall }: { wall: ErrorWallCounts }) {
  const located =
    wall.tin + wall.outTop + wall.outSide + wall.outBack + wall.notUp
  const hot: ZoneKey | null = located > 0 ? biggestZone(wall) : null
  const share = (zone: ZoneKey) =>
    ` — ${Math.round((wall[zone] / located) * 100)}% of everything given away`

  // the leading zone's label carries the share and the bold voice
  const zoneText = (zone: ZoneKey) =>
    cn(
      "tabular-nums",
      hot === zone
        ? "fill-red-500 text-[15px] font-bold"
        : "fill-red-500/75 text-xs font-semibold"
    )

  const label = `Court diagram, seen from the back: ${wall.tin} errors in the tin, ${wall.outTop} out above the front wall, ${wall.outSide} out off the side walls, ${wall.notUp} not up on the floor, ${wall.outBack} out past the back wall.`

  return (
    <svg viewBox="0 0 680 432" role="img" aria-label={label} className="w-full">
      {/* out zone above the front-wall line */}
      <rect
        x="40"
        y="26"
        width="600"
        height="42"
        className={hot === "outTop" ? "fill-red-500/15" : "fill-red-500/5"}
      />
      <line
        x1="40"
        y1="68"
        x2="640"
        y2="68"
        className="stroke-red-500/70"
        strokeWidth="2"
      />
      <text x="52" y="53" className="fill-muted-foreground text-[11px]">
        Out line
      </text>
      <text x="628" y="53" textAnchor="end" className={zoneText("outTop")}>
        Out — top · {wall.outTop}
        {hot === "outTop" && share("outTop")}
      </text>

      {/* wall body */}
      <rect
        x="40"
        y="68"
        width="600"
        height="202"
        className="fill-muted/40 stroke-border"
      />
      <line
        x1="40"
        y1="165"
        x2="640"
        y2="165"
        className="stroke-border"
        strokeDasharray="5 6"
      />
      <text x="52" y="158" className="fill-muted-foreground text-[11px]">
        Service line
      </text>

      {/* side-out columns */}
      <rect
        x="40"
        y="68"
        width="26"
        height="164"
        className={hot === "outSide" ? "fill-red-500/25" : "fill-red-500/10"}
      />
      <rect
        x="614"
        y="68"
        width="26"
        height="164"
        className={hot === "outSide" ? "fill-red-500/25" : "fill-red-500/10"}
      />
      <text
        x="627"
        y="150"
        textAnchor="middle"
        transform="rotate(-90 627 150)"
        className={zoneText("outSide")}
      >
        Out — side · {wall.outSide}
      </text>

      {/* the tin band along the bottom of the wall */}
      <rect
        x="40"
        y="232"
        width="600"
        height="38"
        className={
          hot === "tin"
            ? "fill-red-500/20 stroke-red-500"
            : "fill-red-500/10 stroke-red-500/40"
        }
      />
      <text x="60" y="256" className={zoneText("tin")}>
        Tin · {wall.tin}
        {hot === "tin" && share("tin")}
      </text>

      {/* the floor, running back toward the viewer — not-up dies on it */}
      <polygon
        points="40,270 640,270 668,380 12,380"
        className={cn(
          "stroke-border",
          hot === "notUp" ? "fill-red-500/10" : "fill-muted/25"
        )}
      />
      <text x="340" y="336" textAnchor="middle" className={zoneText("notUp")}>
        Not up · {wall.notUp}
        {hot === "notUp" && share("notUp")}
      </text>

      {/* past the back line is behind the player — out off the back */}
      <line
        x1="12"
        y1="380"
        x2="668"
        y2="380"
        className="stroke-muted-foreground/60"
        strokeWidth="2"
      />
      <rect
        x="12"
        y="380"
        width="656"
        height="34"
        className={hot === "outBack" ? "fill-red-500/15" : "fill-muted/15"}
      />
      <text x="340" y="402" textAnchor="middle" className={zoneText("outBack")}>
        Out — back · {wall.outBack}
        {hot === "outBack" && share("outBack")}
      </text>

      {/* the leading zone gets its scatter of balls */}
      {hot && (
        <g className="fill-red-500/85">
          {ZONE_DOTS[hot].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />
          ))}
        </g>
      )}

      <text
        x="668"
        y="430"
        textAnchor="end"
        className="fill-muted-foreground/70 text-[11px]"
      >
        The court, seen from the back of it
      </text>
    </svg>
  )
}
