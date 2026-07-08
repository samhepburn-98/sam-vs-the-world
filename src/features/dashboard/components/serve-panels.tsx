import {
  PlayerLine,
  RateBar,
  Takeaway,
} from "@/features/dashboard/components/insight-blocks"
import { rate, serveTakeaway } from "@/features/dashboard/lib/match-insights"

import type {
  ServeInsight,
  WonTotal,
} from "@/features/dashboard/lib/match-insights"

// Serve and return (§5.2): the tactical panel. Big numbers for points won
// behind serve vs on return, then own-serve win rate by service box — the
// one that turns into a training note ("the left box leaks").

function BigRate({ label, wt }: { label: string; wt: WonTotal }) {
  const r = rate(wt)
  return (
    <div>
      <div className="text-xl font-semibold tabular-nums">
        {r === null ? "—" : `${Math.round(r * 100)}%`}
      </div>
      <div className="text-xs text-muted-foreground tabular-nums">
        {label} · {wt.won}/{wt.total}
      </div>
    </div>
  )
}

function Panel({
  side,
  name,
  insight,
}: {
  side: "p1" | "p2"
  name: string
  insight: ServeInsight
}) {
  const left = rate(insight.leftBox)
  const right = rate(insight.rightBox)
  const fill = side === "p1" ? "bg-primary" : "bg-foreground/75"
  return (
    // a plain player block, like every other module — the card surface
    // belongs to the section, and cards don't nest
    <div className="flex flex-col gap-3">
      <PlayerLine side={side} name={name} />
      <div className="flex gap-6">
        <BigRate label="On serve" wt={insight.serve} />
        <BigRate label="On return" wt={insight.ret} />
      </div>
      {(insight.leftBox.total > 0 || insight.rightBox.total > 0) && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">
            Win rate by serving box
          </p>
          {insight.leftBox.total > 0 && (
            <RateBar
              label="Left"
              fraction={left ?? 0}
              valueText={left === null ? "—" : `${Math.round(left * 100)}%`}
              valueTitle={`${insight.leftBox.won}/${insight.leftBox.total}`}
              fillClassName={fill}
              strong={left !== null && right !== null && left > right}
            />
          )}
          {insight.rightBox.total > 0 && (
            <RateBar
              label="Right"
              fraction={right ?? 0}
              valueText={right === null ? "—" : `${Math.round(right * 100)}%`}
              valueTitle={`${insight.rightBox.won}/${insight.rightBox.total}`}
              fillClassName={fill}
              strong={left !== null && right !== null && right > left}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function ServePanels({
  serve,
  p1Name,
  p2Name,
}: {
  serve: Record<"p1" | "p2", ServeInsight>
  p1Name: string
  p2Name: string
}) {
  return (
    // container query, not a viewport breakpoint — the panels pair up only
    // when THIS column is wide enough, so they stack inside a half-width
    // grid cell and sit side by side when given the full page
    <div className="@container flex flex-col gap-4">
      <div className="grid gap-5 @lg:grid-cols-2">
        <Panel side="p1" name={p1Name} insight={serve.p1} />
        <Panel side="p2" name={p2Name} insight={serve.p2} />
      </div>
      <Takeaway text={serveTakeaway(serve, p1Name, p2Name)} />
    </div>
  )
}
