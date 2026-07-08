import {
  Legend,
  PlayerLine,
  SegmentBar,
  Takeaway,
} from "@/features/dashboard/components/insight-blocks"
import { errorTakeaway } from "@/features/dashboard/lib/match-insights"

import type { ErrorBreakdown } from "@/features/dashboard/lib/match-insights"

// Where the errors went (§5.2): every error by destination, coloured by
// severity in one destructive ramp — tin loudest (hitting down loses
// matches), out softer, not up softer still.

const SEGMENT_STYLE = {
  tin: "bg-destructive text-white",
  out: "bg-destructive/60 text-white",
  notUp: "bg-destructive/30 text-foreground",
  other: "bg-muted-foreground/20 text-muted-foreground",
} as const

function toSegments(e: ErrorBreakdown) {
  return [
    { count: e.tin, label: "Tin", className: SEGMENT_STYLE.tin },
    { count: e.out, label: "Out", className: SEGMENT_STYLE.out },
    { count: e.notUp, label: "Not up", className: SEGMENT_STYLE.notUp },
    { count: e.other, label: "Untagged", className: SEGMENT_STYLE.other },
  ]
}

export function ErrorDestinations({
  errors,
  p1Name,
  p2Name,
}: {
  errors: Record<"p1" | "p2", ErrorBreakdown>
  p1Name: string
  p2Name: string
}) {
  const anyOther = errors.p1.other + errors.p2.other > 0
  return (
    <div className="flex flex-col gap-4">
      {(["p1", "p2"] as const).map((side) => {
        const e = errors[side]
        const name = side === "p1" ? p1Name : p2Name
        return (
          <div key={side} className="flex flex-col gap-1.5">
            <PlayerLine
              side={side}
              name={name}
              meta={
                e.total === 0
                  ? "No errors"
                  : `${e.total} ${e.total === 1 ? "error" : "errors"} · ${e.unforced} unforced`
              }
            />
            {e.total > 0 && (
              <SegmentBar
                segments={toSegments(e)}
                srLabel={`${name}'s errors by destination`}
              />
            )}
          </div>
        )
      })}
      <Legend
        items={[
          { label: "Tin", className: SEGMENT_STYLE.tin },
          { label: "Out", className: SEGMENT_STYLE.out },
          { label: "Not up", className: SEGMENT_STYLE.notUp },
          ...(anyOther
            ? [{ label: "Untagged", className: SEGMENT_STYLE.other }]
            : []),
        ]}
      />
      <Takeaway text={errorTakeaway(errors, p1Name, p2Name)} />
    </div>
  )
}
