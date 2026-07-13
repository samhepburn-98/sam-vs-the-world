import { H2hTable } from "@/features/dashboard/components/h2h-table"
import { RallyLengthCurve } from "@/features/dashboard/components/rally-length-curve"
import { ServeBoxes } from "@/features/dashboard/components/serve-boxes"
import { StatBarRow } from "@/features/dashboard/components/stat-bar-row"
import { cn } from "@/lib/utils"

import type { H2hData } from "@/features/dashboard/lib/profile-h2h"
import type { ProfileStatsData } from "@/features/dashboard/lib/profile-stats"
import type { ReactNode } from "react"

// The Stats tab: the whole player as a dense bento of small multiples, built
// for scanning before a match — every card reads real data. Six cards come
// off the insight RPCs via computeProfileStats; head-to-head aggregates the
// player's full match_results history via computeH2h.

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
  h2h,
}: {
  stats: ProfileStatsData
  h2h: H2hData
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
        read={h2h.read}
        className="lg:col-span-7"
      >
        <H2hTable rows={h2h.rows} />
      </Panel>

      <Panel
        title="Serve pressure"
        sub="two-serve rallies"
        read={stats.servePressure.read}
        className="lg:col-span-5"
      >
        {[stats.servePressure.first, stats.servePressure.second].map((row) => (
          <StatBarRow
            key={row.label}
            label={row.label}
            pct={row.of > 0 ? Math.round((row.won / row.of) * 100) : 0}
            value={row.of > 0 ? `${row.won} of ${row.of}` : "—"}
          />
        ))}
        <StatBarRow
          label={stats.servePressure.faults.label}
          pct={
            stats.servePressure.faults.of > 0
              ? Math.round(
                  (stats.servePressure.faults.won /
                    stats.servePressure.faults.of) *
                    100
                )
              : 0
          }
          value={
            stats.servePressure.faults.of > 0
              ? `${stats.servePressure.faults.won} of ${stats.servePressure.faults.of}`
              : "—"
          }
          tone="loss"
        />
      </Panel>
    </div>
  )
}
