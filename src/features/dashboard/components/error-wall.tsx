import type { ErrorWallCounts } from "@/features/dashboard/lib/profile-fixture"

// The error wall: the front wall as the player sees it, with every way of
// giving a point away drawn where it happens — the tin band along the
// bottom, the out line along the top, the side-wall columns. Errors that
// can't land on a front-wall elevation (not up, out off the back) sit as
// chips on the floor below. The tin band is the loudest thing on the page
// by design: it's usually the biggest single leak.

export function ErrorWall({ wall }: { wall: ErrorWallCounts }) {
  const label = `Front wall diagram: ${wall.tin} errors in the tin, ${wall.outTop} out above the front wall, ${wall.outSide} out off the side walls, ${wall.notUp} not up, ${wall.outBack} out off the back wall.`

  return (
    <svg viewBox="0 0 680 380" role="img" aria-label={label} className="w-full">
      {/* out zone above the front-wall line */}
      <rect x="40" y="26" width="600" height="42" className="fill-red-500/5" />
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
      <text
        x="628"
        y="53"
        textAnchor="end"
        className="fill-red-500 text-xs font-semibold tabular-nums"
      >
        Out — top · {wall.outTop}
      </text>

      {/* wall body */}
      <rect
        x="40"
        y="68"
        width="600"
        height="242"
        className="fill-muted/40 stroke-border"
      />
      <line
        x1="40"
        y1="185"
        x2="640"
        y2="185"
        className="stroke-border"
        strokeDasharray="5 6"
      />
      <text x="52" y="178" className="fill-muted-foreground text-[11px]">
        Service line
      </text>

      {/* side-out columns */}
      <rect x="40" y="68" width="26" height="242" className="fill-red-500/10" />
      <rect
        x="614"
        y="68"
        width="26"
        height="242"
        className="fill-red-500/10"
      />
      <text
        x="627"
        y="160"
        textAnchor="middle"
        transform="rotate(-90 627 160)"
        className="fill-red-500 text-[11px] font-semibold tabular-nums"
      >
        Out — side · {wall.outSide}
      </text>

      {/* the tin band */}
      <rect
        x="40"
        y="272"
        width="600"
        height="38"
        className="fill-red-500/20 stroke-red-500"
      />
      <text
        x="60"
        y="296"
        className="fill-red-500 text-[15px] font-bold tabular-nums"
      >
        Tin · {wall.tin} errors — {wall.tinShare}
      </text>
      <g className="fill-red-500/85">
        <circle cx="470" cy="284" r="3" />
        <circle cx="502" cy="296" r="3" />
        <circle cx="524" cy="288" r="3" />
        <circle cx="548" cy="299" r="3" />
        <circle cx="566" cy="284" r="3" />
        <circle cx="588" cy="293" r="3" />
        <circle cx="609" cy="287" r="3" />
      </g>

      {/* floor */}
      <line
        x1="20"
        y1="310"
        x2="660"
        y2="310"
        className="stroke-muted-foreground/60"
        strokeWidth="2"
      />

      {/* errors with no spot on the wall */}
      <g className="text-xs font-semibold tabular-nums">
        <rect
          x="40"
          y="332"
          width="130"
          height="32"
          rx="16"
          className="fill-none stroke-border"
        />
        <text
          x="105"
          y="352"
          textAnchor="middle"
          className="fill-muted-foreground"
        >
          Not up · {wall.notUp}
        </text>
        <rect
          x="182"
          y="332"
          width="150"
          height="32"
          rx="16"
          className="fill-none stroke-border"
        />
        <text
          x="257"
          y="352"
          textAnchor="middle"
          className="fill-muted-foreground"
        >
          Out — back · {wall.outBack}
        </text>
      </g>
      <text
        x="640"
        y="353"
        textAnchor="end"
        className="fill-muted-foreground/70 text-[11px]"
      >
        Front wall, as you see it
      </text>
    </svg>
  )
}
