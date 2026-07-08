import { Takeaway } from "@/features/dashboard/components/insight-blocks"
import { grindTakeaway } from "@/features/dashboard/lib/match-insights"
import { cn } from "@/lib/utils"

import type {
  LengthBucket,
  RallyLengthSplit,
} from "@/features/dashboard/lib/match-insights"

// Who wins the grind (§5.2): win share per rally-length bucket. The style
// fingerprint — quick-strike player vs war-of-attrition player — shows as
// the colour split drifting across the three rows.

function bucketLabel(b: LengthBucket) {
  if (b.max === null) return `Long · ${b.min}+ shots`
  return `${b.min === 1 ? "Short" : "Mid"} · ${b.min}–${b.max} shots`
}

export function RallyLengthBars({
  split,
  p1Name,
  p2Name,
}: {
  split: RallyLengthSplit
  p1Name: string
  p2Name: string
}) {
  return (
    <div className="flex flex-col gap-4">
      {split.buckets.map((b) => {
        const total = b.won.p1 + b.won.p2
        const p1Share = total === 0 ? 0 : b.won.p1 / total
        return (
          <div key={b.min} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>{bucketLabel(b)}</span>
              <span className="tabular-nums">
                {total} {total === 1 ? "rally" : "rallies"}
              </span>
            </div>
            {total === 0 ? (
              <div aria-hidden className="h-2.5 rounded-full bg-muted" />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-10 shrink-0 text-right text-sm tabular-nums",
                    p1Share >= 0.5 ? "font-semibold" : "text-muted-foreground"
                  )}
                >
                  {Math.round(p1Share * 100)}%
                  <span className="sr-only">
                    {" "}
                    to {p1Name} ({b.won.p1} of {total})
                  </span>
                </span>
                <div className="flex h-2.5 flex-1 overflow-hidden rounded-full">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${p1Share * 100}%` }}
                  />
                  <div
                    className="h-full bg-foreground/75"
                    style={{ width: `${(1 - p1Share) * 100}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "w-10 shrink-0 text-sm tabular-nums",
                    p1Share < 0.5 ? "font-semibold" : "text-muted-foreground"
                  )}
                >
                  {Math.round((1 - p1Share) * 100)}%
                  <span className="sr-only">
                    {" "}
                    to {p2Name} ({b.won.p2} of {total})
                  </span>
                </span>
              </div>
            )}
          </div>
        )
      })}
      {split.untagged > 0 && (
        <p className="text-xs text-muted-foreground">
          {split.untagged} {split.untagged === 1 ? "rally has" : "rallies have"}{" "}
          no shot count and sit this one out.
        </p>
      )}
      <Takeaway text={grindTakeaway(split, p1Name, p2Name)} />
    </div>
  )
}
