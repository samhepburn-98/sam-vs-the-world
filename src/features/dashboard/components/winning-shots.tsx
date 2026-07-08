import {
  PlayerLine,
  RateBar,
  Takeaway,
} from "@/features/dashboard/components/insight-blocks"
import { shotsTakeaway } from "@/features/dashboard/lib/match-insights"
import { humanise } from "@/features/dashboard/lib/humanise"

import type { WinningShots as WinningShotsData } from "@/features/dashboard/lib/match-insights"

// Winning shots (§5.2): each player's putaway weapons, ranked. Bars are
// scaled to the player's own top shot, so the shape reads "what do I reach
// for" rather than comparing absolute counts across players.

function ShotColumn({
  side,
  name,
  data,
}: {
  side: "p1" | "p2"
  name: string
  data: WinningShotsData
}) {
  const max = data.shots[0]?.count ?? 0
  const fill = side === "p1" ? "bg-primary" : "bg-foreground/75"
  return (
    <div className="flex flex-col gap-2">
      <PlayerLine
        side={side}
        name={name}
        meta={`${data.total} ${data.total === 1 ? "winner" : "winners"}`}
      />
      {data.shots.length === 0 ? (
        <p className="text-xs text-muted-foreground">No shot types tagged.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {data.shots.map((s, i) => (
            <RateBar
              key={s.shot}
              label={humanise(s.shot)}
              fraction={max === 0 ? 0 : s.count / max}
              valueText={String(s.count)}
              fillClassName={fill}
              strong={i === 0}
            />
          ))}
        </div>
      )}
      {data.untyped > 0 && (
        <p className="text-xs text-muted-foreground">
          + {data.untyped} untyped
        </p>
      )}
    </div>
  )
}

export function WinningShots({
  shots,
  p1Name,
  p2Name,
}: {
  shots: Record<"p1" | "p2", WinningShotsData>
  p1Name: string
  p2Name: string
}) {
  return (
    // container query — the two columns pair up only when this section is
    // actually wide enough, not when the viewport happens to be
    <div className="@container flex flex-col gap-3">
      <div className="grid gap-6 @lg:grid-cols-2">
        <ShotColumn side="p1" name={p1Name} data={shots.p1} />
        <ShotColumn side="p2" name={p2Name} data={shots.p2} />
      </div>
      <Takeaway text={shotsTakeaway(shots, p1Name, p2Name)} />
    </div>
  )
}
