import { H2hTable } from "@/features/dashboard/components/h2h-table"
import { RallyLengthCurve } from "@/features/dashboard/components/rally-length-curve"
import { SeasonStrip } from "@/features/dashboard/components/season-strip"
import { ServeBoxes } from "@/features/dashboard/components/serve-boxes"
import { StatBarRow } from "@/features/dashboard/components/stat-bar-row"
import { cn } from "@/lib/utils"

import type { ProfileFixture } from "@/features/dashboard/lib/profile-fixture"
import type { ProfileStatsData } from "@/features/dashboard/lib/profile-stats"
import type { ReactNode } from "react"

// The Stats tab: the whole player as a dense bento of small multiples, built
// for scanning before a match. The four RPC-backed cards (rally curve, phase
// win rates, serve, errors given) read `stats`; point-enders, head-to-head,
// recent matches, and the season strip still read `fixture` until each is
// wired.

function Panel({
  title,
  sub,
  read,
  className,
  children,
}: {
  title: string
  sub?: string
  /** The one-line takeaway under the numbers. */
  read?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col gap-3.5 rounded-2xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10",
        className
      )}
    >
      <h3 className="flex items-baseline justify-between gap-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
        {title}
        {sub && (
          <span className="truncate text-[11px] font-normal tracking-normal text-muted-foreground/70 normal-case">
            {sub}
          </span>
        )}
      </h3>
      <div className="flex-1">{children}</div>
      {read && <p className="text-xs text-muted-foreground">{read}</p>}
    </section>
  )
}

export function ProfileStatsTab({
  stats,
  fixture,
}: {
  stats: ProfileStatsData
  fixture: ProfileFixture
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Panel
        title="Win rate by rally length"
        sub="1–3 · 4–8 · 9+ shots"
        className="lg:col-span-7"
      >
        <RallyLengthCurve buckets={stats.curve} />
      </Panel>

      <Panel
        title="By game phase"
        sub="win rate early → close"
        read={stats.phases.read}
        className="lg:col-span-5"
      >
        {stats.phases.rows.map((row) => (
          <StatBarRow
            key={row.label}
            label={row.label}
            pct={row.of > 0 ? Math.round((row.won / row.of) * 100) : 0}
            value={row.of > 0 ? `${row.won} of ${row.of}` : "—"}
          />
        ))}
      </Panel>

      <Panel title="Serve" className="lg:col-span-4">
        <ServeBoxes serve={stats.serve} />
      </Panel>

      <Panel
        title="Point-enders"
        read={stats.pointEnders.read}
        className="lg:col-span-4"
      >
        {stats.pointEnders.rows.map((row) => (
          <StatBarRow
            key={row.label}
            label={row.label}
            pct={row.share}
            value={String(row.count)}
          />
        ))}
      </Panel>

      <Panel
        title="Errors given"
        read={stats.errorsGiven.read}
        className="lg:col-span-4"
      >
        {stats.errorsGiven.rows.map((row) => (
          <StatBarRow
            key={row.label}
            label={row.label}
            pct={row.share}
            value={String(row.count)}
            tone="loss"
          />
        ))}
      </Panel>

      <Panel
        title="Head-to-head"
        sub="games won share per rival"
        read={fixture.stats.h2h.read}
        className="lg:col-span-7"
      >
        <H2hTable rows={fixture.stats.h2h.rows} />
      </Panel>

      <Panel
        title="Recent matches"
        read="Every row will open the rally-by-rally log."
        className="lg:col-span-5"
      >
        <ul className="divide-y">
          {fixture.stats.recent.map((m) => (
            <li
              key={`${m.date}-${m.opponent}`}
              className="flex items-center gap-3 py-2 text-sm"
            >
              <span className="w-12 shrink-0 text-muted-foreground tabular-nums">
                {m.date}
              </span>
              <span className="flex-1 font-medium">{m.opponent}</span>
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-md text-xs font-bold",
                  m.won
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-red-500/15 text-red-500"
                )}
              >
                {m.won ? "W" : "L"}
              </span>
              <span className="w-9 text-right tabular-nums">{m.result}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="All 40 games"
        sub="oldest to newest"
        className="lg:col-span-12"
      >
        <SeasonStrip games={fixture.season.games} />
      </Panel>
    </div>
  )
}
