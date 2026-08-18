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
import { RallyLengthHisto } from "@/features/dashboard/components/rally-length-histo"
import { RallyTable } from "@/features/dashboard/components/rally-table"
import { StatCard } from "@/features/dashboard/components/stat-card"
import { WinRateTrend } from "@/features/dashboard/components/win-rate-trend"
import {
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/utils/insight-thresholds"
import { CourtDiagram } from "@/components/court/court-diagram"
import { SectionTitle } from "@/components/typography"
import { Skeleton } from "@/components/ui/skeleton"

import type { CategoryKey } from "@/features/dashboard/categories"
import type { InsightFilters } from "@/features/dashboard/schemas/insights"
import type { TrendPoint } from "@/features/dashboard/components/win-rate-trend"

// The per-category L2 content (§3.3): a key-stat row, the category's primary
// chart(s), and — for the rally-drilled categories — the underlying-rallies
// table fed by that category's `*_rallies` companion.

interface ContentProps {
  playerId: string
  filters: InsightFilters
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </section>
  )
}

function KeyStats({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  )
}

function Loading() {
  return <Skeleton className="h-64 w-full rounded-2xl" />
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
        <Section title="Win rate over time">
          <WinRateTrend data={trend} />
        </Section>
      )}

      <Section title="Recent results">
        <ul className="flex flex-col divide-y">
          {h.recent_games.map((g) => (
            <li key={g.game_id}>
              <Link
                to="/matches/$matchId"
                params={{ matchId: g.match_id }}
                search={{ rally: undefined }}
                className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
              >
                <span className="text-sm text-muted-foreground tabular-nums">
                  {g.date}
                </span>
                <span className="text-sm tabular-nums">
                  {g.player_score}–{g.opponent_score}
                </span>
                <span
                  className={
                    g.won === null
                      ? "text-sm text-muted-foreground"
                      : g.won
                        ? "text-sm font-semibold"
                        : "text-sm text-muted-foreground"
                  }
                >
                  {g.won === null ? "Undecided" : g.won ? "Won" : "Lost"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

// ---- serve ----------------------------------------------------------------
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

      <Section title="Win rate by serve side">
        <div className="flex items-end gap-8">
          <CourtDiagram
            className="h-56 w-36 text-muted-foreground"
            leftShare={
              s.left_served > 0 ? s.left_wins / s.left_served : undefined
            }
            rightShare={
              s.right_served > 0 ? s.right_wins / s.right_served : undefined
            }
          />
          <dl className="text-sm">
            <div className="flex gap-2 py-1">
              <dt className="w-24 text-muted-foreground">Left box</dt>
              <dd className="tabular-nums">
                {s.left_served > 0
                  ? `${Math.round((s.left_wins / s.left_served) * 100)}% · ${s.left_wins} of ${s.left_served}`
                  : "—"}
              </dd>
            </div>
            <div className="flex gap-2 py-1">
              <dt className="w-24 text-muted-foreground">Right box</dt>
              <dd className="tabular-nums">
                {s.right_served > 0
                  ? `${Math.round((s.right_wins / s.right_served) * 100)}% · ${s.right_wins} of ${s.right_served}`
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </Section>

      <Section title="Rallies served">
        <RallyTable rallies={rallies.data} playerId={playerId} />
      </Section>
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

      <Section title="Where the points go">
        <ErrorBreakdown profile={e} />
      </Section>

      <Section title="Error rallies">
        <RallyTable rallies={rallies.data} playerId={playerId} />
      </Section>
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

      <Section title="Length distribution">
        <RallyLengthHisto lengths={l} />
      </Section>

      <Section title="Rallies">
        <RallyTable rallies={rallies.data} playerId={playerId} />
      </Section>
    </div>
  )
}

// ---- momentum -------------------------------------------------------------
function Momentum({ playerId, filters }: ContentProps) {
  const mom = useMomentum(playerId, filters)
  const rallies = useComebackRallies(playerId, filters)
  if (!mom.data || !rallies.data) return <Loading />
  const m = mom.data

  const phaseRate = (wins: number, total: number) =>
    total > 0 ? `${Math.round((wins / total) * 100)}%` : "—"

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
          value={phaseRate(m.close_wins, m.close_rallies)}
        />
      </KeyStats>

      <Section title="Points won by phase of game">
        <dl className="grid grid-cols-3 gap-4 text-center text-sm">
          {(
            [
              ["Early", m.early_wins, m.early_rallies],
              ["Mid", m.mid_wins, m.mid_rallies],
              ["Close", m.close_wins, m.close_rallies],
            ] as const
          ).map(([label, wins, total]) => (
            <div
              key={label}
              className="rounded-lg bg-card p-4 ring-1 ring-foreground/10"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-2xl font-bold tabular-nums">
                {phaseRate(wins, total)}
              </dd>
              <dd className="text-xs text-muted-foreground tabular-nums">
                {wins} of {total}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Comebacks">
        {m.comeback_games.length === 0 ? (
          <p className="text-sm text-muted-foreground">No comebacks yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {m.comeback_games.map((g) => (
              <div key={g.game_id} className="flex flex-col gap-2">
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
      </Section>
    </div>
  )
}

const CONTENT: Record<CategoryKey, (props: ContentProps) => React.ReactNode> = {
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
