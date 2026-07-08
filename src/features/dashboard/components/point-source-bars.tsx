import {
  Legend,
  PlayerLine,
  SegmentBar,
  Takeaway,
} from "@/features/dashboard/components/insight-blocks"
import {
  earnedShare,
  pointSourcesTakeaway,
} from "@/features/dashboard/lib/match-insights"

import type { PointSources } from "@/features/dashboard/lib/match-insights"

// Where the points came from (§5.2): ink = earned off your own racket,
// washed grey = gifted by the other side. Colour carries meaning here, not
// player identity — a mostly-grey bar says "won on their mistakes" at a
// glance, whoever it belongs to.

const SEGMENT_STYLE = {
  ownWinner: "bg-foreground text-background",
  forced: "bg-foreground/70 text-background",
  unforced: "bg-muted-foreground/40 text-foreground",
  stroke: "bg-muted-foreground/25 text-foreground",
  untagged: "bg-muted-foreground/15 text-muted-foreground",
} as const

function toSegments(s: PointSources) {
  return [
    {
      count: s.ownWinner,
      label: "Own winners",
      className: SEGMENT_STYLE.ownWinner,
    },
    {
      count: s.forced,
      label: "Errors forced",
      className: SEGMENT_STYLE.forced,
    },
    {
      count: s.unforced,
      label: "Opponent unforced",
      className: SEGMENT_STYLE.unforced,
    },
    { count: s.stroke, label: "Strokes", className: SEGMENT_STYLE.stroke },
    {
      count: s.untagged,
      label: "Untagged errors",
      className: SEGMENT_STYLE.untagged,
    },
  ]
}

export function PointSourceBars({
  sources,
  p1Name,
  p2Name,
}: {
  sources: Record<"p1" | "p2", PointSources>
  p1Name: string
  p2Name: string
}) {
  const anyUntagged = sources.p1.untagged + sources.p2.untagged > 0
  const meta = (s: PointSources) => {
    const earned = earnedShare(s)
    return earned === null ? null : `${Math.round(earned * 100)}% earned`
  }

  return (
    <div className="flex flex-col gap-5">
      {(["p1", "p2"] as const).map((side) => (
        <div key={side} className="flex flex-col gap-1.5">
          <PlayerLine
            side={side}
            name={side === "p1" ? p1Name : p2Name}
            meta={
              <>
                {sources[side].total} points
                {meta(sources[side]) && <> · {meta(sources[side])}</>}
              </>
            }
          />
          <SegmentBar
            segments={toSegments(sources[side])}
            srLabel={`${side === "p1" ? p1Name : p2Name}'s point sources`}
          />
        </div>
      ))}
      <Legend
        items={[
          { label: "Own winners", className: SEGMENT_STYLE.ownWinner },
          { label: "Errors forced", className: SEGMENT_STYLE.forced },
          { label: "Opponent unforced", className: SEGMENT_STYLE.unforced },
          { label: "Strokes", className: SEGMENT_STYLE.stroke },
          ...(anyUntagged
            ? [{ label: "Untagged errors", className: SEGMENT_STYLE.untagged }]
            : []),
        ]}
      />
      <Takeaway text={pointSourcesTakeaway(sources, p1Name, p2Name)} />
    </div>
  )
}
