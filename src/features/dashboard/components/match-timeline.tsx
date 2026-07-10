import { cn } from "@/lib/utils"

import type { TimelineMatch } from "@/features/dashboard/lib/profile-fixture"

// Matches as a timeline, most recent first: a result node, the score line,
// and the one thing worth remembering about the night. This is the Summary
// tab's history — the Stats tab keeps the compact tabular version.

export function MatchTimeline({ matches }: { matches: Array<TimelineMatch> }) {
  return (
    <ol className="relative flex flex-col gap-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-border">
      {matches.map((m) => (
        <li key={`${m.date}-${m.opponent}`} className="relative pl-9">
          <span
            aria-hidden
            className={cn(
              "absolute top-1 left-0 size-[15px] rounded-full border-2 border-background",
              m.won ? "bg-emerald-500" : "bg-red-500"
            )}
          />
          <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            {m.date} · {m.venue}
          </p>
          <p className="mt-0.5 font-semibold">
            <span className={m.won ? "text-emerald-500" : "text-red-500"}>
              {m.result}
            </span>{" "}
            vs {m.opponent}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {m.games}
          </p>
          <p className="mt-1.5 inline-block rounded-full border px-3 py-1 text-xs text-muted-foreground">
            {m.note}
          </p>
        </li>
      ))}
    </ol>
  )
}
