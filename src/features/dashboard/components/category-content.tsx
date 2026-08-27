import { Link } from "@tanstack/react-router"

import { useErrorProfile } from "@/features/dashboard/api/get-error-profile"
import { useErrorRallies } from "@/features/dashboard/api/get-error-rallies"
import { useComebackRallies } from "@/features/dashboard/api/get-comeback-rallies"
import { useMomentum } from "@/features/dashboard/api/get-momentum"
import { usePlayerHeadline } from "@/features/dashboard/api/get-player-headline"
import { useRallyLengths } from "@/features/dashboard/api/get-rally-lengths"
import { useRallyLengthRallies } from "@/features/dashboard/api/get-rally-length-rallies"
import { useServeStats } from "@/features/dashboard/api/get-serve-stats"
import { useServeRallies } from "@/features/dashboard/api/get-serve-rallies"
import { ErrorBreakdown } from "@/features/dashboard/components/error-breakdown"
import { MomentumChart } from "@/features/dashboard/components/momentum-chart"
import {
  PROFILE_PANEL,
  ProfileSection,
} from "@/features/dashboard/components/profile-section"
import { RallyLengthHisto } from "@/features/dashboard/components/rally-length-histo"
import { RallyTable } from "@/features/dashboard/components/rally-table"
import { StatCard } from "@/features/dashboard/components/stat-card"
import { WinRateTrend } from "@/features/dashboard/components/win-rate-trend"
import {
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/lib/insight-thresholds"
import { CourtDiagram } from "@/components/court/court-diagram"
import { ResultChip } from "@/components/broadcast/result-chip"
import { StatRow } from "@/components/broadcast/stat-row"
import { Skeleton } from "@/components/ui/skeleton"

import type { CategoryKey } from "@/features/dashboard/lib/categories"
import type { InsightFilters } from "@/features/dashboard/schemas/insights"
import type { TrendPoint } from "@/features/dashboard/components/win-rate-trend"
import type { ReactNode } from "react"

// The per-category L2 content (§3.3): a key-stat row, the category's primary
// chart(s), and — for the rally-drilled categories — the underlying-rallies
// table fed by that category's `*_rallies` companion.
//
// Every band opens as a ProfileSection, the same shape the profile tabs use,
// so dropping a level changes the depth of the data and not the language.

interface ContentProps {
  playerId: string
  filters: InsightFilters
}

/** The key-stat row: the category's headline numbers, each carrying its own
 *  receipt and its own sample gate (§3.5). */
function KeyStats({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-4">{children}</div>
  )
}

function Loading() {
  return <Skeleton className="h-64 w-full" />
}

// ---- head-to-head: results & form (drills to matches, not rallies) --------
function HeadToHead({ playerId, filters }: ContentProps) {
  const headline = usePlayerHeadline(playerId, filters)
  if (!headline.data) return <Loading />
  const h = headline.data

  // cumulative win rate over the recent games, oldest first
  const games = h.recent_games.slice().reverse()
  let won = 0
  let decided = 0
  const trend: Array<TrendPoint> = []
  for (const g of games) {
    if (g.won === null) continue
    decided += 1
    if (g.won) won += 1
    trend.push({ date: g.date, winRate: Math.round((won / decided) * 100) })
  }

  return (
    <div className="flex flex-col gap-8">
      <KeyStats>
        <StatCard
          label="Win rate"
          rate={{ won: h.games_won, of: h.games_decided }}
          minSample={MIN_GAMES_FOR_WIN_RATE}
        />
        <StatCard
          label="Games"
          value={`${h.games_won}–${h.games_decided - h.games_won}`}
        />
        <StatCard
          label="Matches"
          value={`${h.matches_won}–${h.matches_decided - h.matches_won}`}
        />
      </KeyStats>

      {trend.length > 0 && (
        <ProfileSection title="Win rate over time">
          <div className={PROFILE_PANEL}>
            <WinRateTrend data={trend} />
          </div>
        </ProfileSection>
      )}

      <ProfileSection title="Recent results">
        <ul className="flex flex-col gap-0.5">
          {h.recent_games.map((g) => (
            <li key={g.game_id}>
              <Link
                to="/matches/$matchId"
                params={{ matchId: g.match_id }}
                search={{ rally: undefined }}
                className="flex items-center justify-between gap-3 border-l-4 border-border bg-card px-3 py-2 transition-colors hover:border-primary hover:bg-accent"
              >
                <span className="text-sm text-muted-foreground tabular-nums">
                  {g.date}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-heading text-base font-bold tabular-nums">
                    {g.player_score}–{g.opponent_score}
                  </span>
                  {/* a game that ended level is a draw, not a game still in
                      play — the D chip says exactly that */}
                  <ResultChip
                    result={g.won === null ? "d" : g.won ? "w" : "l"}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ProfileSection>
    </div>
  )
}

// ---- serve ----------------------------------------------------------------
/** One service box's reading, as a lower-third row on the inset surface.
 *  An unserved box shows the dash — never a rate over zero serves. */
function BoxRow({
  label,
  wins,
  served,
}: {
  label: string
  wins: number
  served: number
}) {
  return (
    <StatRow
      className="bg-background"
      label={label}
      value={served > 0 ? `${Math.round((wins / served) * 100)}%` : "—"}
      detail={served > 0 ? `${wins} of ${served}` : undefined}
    />
  )
}

function Serve({ playerId, filters }: ContentProps) {
  const stats = useServeStats(playerId, filters)
  const rallies = useServeRallies(playerId, filters)
  if (!stats.data || !rallies.data) return <Loading />
  const s = stats.data
  const twoServe = s.two_serve_rallies_served

  return (
    <div className="flex flex-col gap-8">
      <KeyStats>
        <StatCard
          label="Serve win rate"
          rate={{ won: s.serve_wins, of: s.rallies_served }}
          minSample={MIN_RALLIES_FOR_RATE}
        />
        <StatCard
          label="First-serve faults"
          rate={{ won: s.first_serve_faults, of: twoServe }}
          minSample={MIN_RALLIES_FOR_RATE}
        />
        <StatCard label="Aces" value={s.aces} />
        <StatCard label="Double faults" value={s.double_faults} />
      </KeyStats>

      <ProfileSection title="Win rate by serve side">
        <div className={`${PROFILE_PANEL} flex flex-wrap items-center gap-6`}>
          <CourtDiagram
            className="h-56 w-36 shrink-0 text-muted-foreground"
            leftShare={
              s.left_served > 0 ? s.left_wins / s.left_served : undefined
            }
            rightShare={
              s.right_served > 0 ? s.right_wins / s.right_served : undefined
            }
          />
          <div className="flex min-w-56 flex-1 flex-col gap-0.5">
            <BoxRow
              label="Left box"
              wins={s.left_wins}
              served={s.left_served}
            />
            <BoxRow
              label="Right box"
              wins={s.right_wins}
              served={s.right_served}
            />
          </div>
        </div>
      </ProfileSection>

      <ProfileSection
        title="Rallies served"
        lede="Every rally behind the numbers above. Open one for the full point."
      >
        <RallyTable rallies={rallies.data} playerId={playerId} />
      </ProfileSection>
    </div>
  )
}

// ---- errors ---------------------------------------------------------------
function Errors({ playerId, filters }: ContentProps) {
  const profile = useErrorProfile(playerId, filters)
  const rallies = useErrorRallies(playerId, filters)
  if (!profile.data || !rallies.data) return <Loading />
  const e = profile.data

  return (
    <div className="flex flex-col gap-8">
      <KeyStats>
        <StatCard
          label="Unforced per game"
          value={(e.unforced_errors / e.games_played).toFixed(1)}
          sample={e.games_played}
          minSample={MIN_GAMES_FOR_WIN_RATE}
        />
        <StatCard label="Errors total" value={e.errors_total} />
        <StatCard label="Forced" value={e.forced_errors} />
        <StatCard label="Unforced" value={e.unforced_errors} />
      </KeyStats>

      <ProfileSection title="Where the points go">
        <div className={PROFILE_PANEL}>
          <ErrorBreakdown profile={e} />
        </div>
      </ProfileSection>

      <ProfileSection
        title="Error rallies"
        lede="Every rally behind the numbers above. Open one for the full point."
      >
        <RallyTable rallies={rallies.data} playerId={playerId} />
      </ProfileSection>
    </div>
  )
}

// ---- rallies --------------------------------------------------------------
function Rallies({ playerId, filters }: ContentProps) {
  const lengths = useRallyLengths(playerId, filters)
  const rallies = useRallyLengthRallies(playerId, null, filters)
  if (!lengths.data || !rallies.data) return <Loading />
  const l = lengths.data

  return (
    <div className="flex flex-col gap-8">
      <KeyStats>
        <StatCard
          label="Average length"
          value={l.avg_length?.toFixed(1) ?? "—"}
          unit="shots"
          sample={l.total_rallies}
          minSample={MIN_RALLIES_FOR_RATE}
        />
        <StatCard label="Longest rally" value={l.longest} unit="shots" />
        <StatCard label="Rallies" value={l.total_rallies} />
      </KeyStats>

      <ProfileSection title="Length distribution">
        <div className={PROFILE_PANEL}>
          <RallyLengthHisto lengths={l} />
        </div>
      </ProfileSection>

      <ProfileSection
        title="Rallies"
        lede="Every rally behind the numbers above. Open one for the full point."
      >
        <RallyTable rallies={rallies.data} playerId={playerId} />
      </ProfileSection>
    </div>
  )
}

// ---- momentum -------------------------------------------------------------
function Momentum({ playerId, filters }: ContentProps) {
  const mom = useMomentum(playerId, filters)
  const rallies = useComebackRallies(playerId, filters)
  if (!mom.data || !rallies.data) return <Loading />
  const m = mom.data

  // group the comeback rallies by game to draw one momentum chart each
  const byGame = new Map<string, typeof rallies.data>()
  for (const r of rallies.data) {
    if (!r.game_id) continue
    const arr = byGame.get(r.game_id) ?? []
    arr.push(r)
    byGame.set(r.game_id, arr)
  }

  return (
    <div className="flex flex-col gap-8">
      <KeyStats>
        <StatCard label="Comebacks" value={m.comebacks} />
        <StatCard
          label="Longest win streak"
          value={m.longest_streak}
          unit="rallies"
        />
        <StatCard
          label="Won when close"
          rate={{ won: m.close_wins, of: m.close_rallies }}
          minSample={MIN_RALLIES_FOR_RATE}
        />
      </KeyStats>

      <ProfileSection title="Points won by phase of game">
        {/* the same three bands the profile tile previews, at full size and
            each gated on its own sample */}
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {(
            [
              ["Early", m.early_wins, m.early_rallies],
              ["Mid", m.mid_wins, m.mid_rallies],
              ["Close", m.close_wins, m.close_rallies],
            ] as const
          ).map(([label, wins, total]) => (
            <StatCard
              key={label}
              label={label}
              rate={{ won: wins, of: total }}
              minSample={MIN_RALLIES_FOR_RATE}
            />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection title="Comebacks">
        {m.comeback_games.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comebacks yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {m.comeback_games.map((g) => (
              <div
                key={g.game_id}
                className={`${PROFILE_PANEL} flex flex-col gap-2`}
              >
                <p className="text-sm">
                  <span className="tabular-nums">{g.date}</span> — trailed by{" "}
                  <span className="tabular-nums">{g.max_deficit}</span>, won{" "}
                  <span className="tabular-nums">
                    {g.player_score}–{g.opponent_score}
                  </span>
                </p>
                {byGame.get(g.game_id) && (
                  <MomentumChart
                    rallies={byGame.get(g.game_id)!}
                    playerId={playerId}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </ProfileSection>
    </div>
  )
}

const CONTENT: Record<CategoryKey, (props: ContentProps) => ReactNode> = {
  "head-to-head": HeadToHead,
  serve: Serve,
  errors: Errors,
  rallies: Rallies,
  momentum: Momentum,
}

export function CategoryContent({
  category,
  playerId,
  filters,
}: {
  category: CategoryKey
  playerId: string
  filters: InsightFilters
}) {
  const Component = CONTENT[category]
  return <Component playerId={playerId} filters={filters} />
}
