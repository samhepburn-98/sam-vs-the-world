import { createFileRoute } from "@tanstack/react-router"

import { matchesQueryOptions } from "@/features/dashboard/api/get-matches"
import {
  errorProfileOptions,
  useErrorProfile,
} from "@/features/dashboard/api/get-error-profile"
import {
  momentumOptions,
  useMomentum,
} from "@/features/dashboard/api/get-momentum"
import {
  playerHeadlineOptions,
  usePlayerHeadline,
} from "@/features/dashboard/api/get-player-headline"
import {
  rallyLengthsOptions,
  useRallyLengths,
} from "@/features/dashboard/api/get-rally-lengths"
import {
  serveStatsOptions,
  useServeStats,
} from "@/features/dashboard/api/get-serve-stats"
import { InsightCard } from "@/features/dashboard/components/insight-card"
import {
  ErrorSplitPreview,
  FormDotsPreview,
  MomentumPhasePreview,
  RallyBucketsPreview,
  ServeSidePreview,
} from "@/features/dashboard/components/insight-previews"
import { PlayerHeader } from "@/features/dashboard/components/player-header"
import { PlayerRecentMatches } from "@/features/dashboard/components/player-recent-matches"
import { ProfileStatStrip } from "@/features/dashboard/components/profile-stat-strip"
import {
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/utils/insight-thresholds"
import { Skeleton } from "@/components/ui/skeleton"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { RallyLengths } from "@/features/dashboard/schemas/insights"

// Player profile (§5.1): a profile, not a menu. It leads with the win-rate
// hero and an at-a-glance stat strip, then the five insight cards preview
// their deep pages, then the player's own recent matches. All-time — filtering
// lives on the category pages this links into.

export const Route = createFileRoute("/players/$playerId/")({
  loader: async ({ context, params }) => {
    const id = params.playerId
    await Promise.all([
      context.queryClient.ensureQueryData(playerHeadlineOptions(id, {})),
      context.queryClient.ensureQueryData(serveStatsOptions(id, {})),
      context.queryClient.ensureQueryData(errorProfileOptions(id, {})),
      context.queryClient.ensureQueryData(rallyLengthsOptions(id, {})),
      context.queryClient.ensureQueryData(momentumOptions(id, {})),
      context.queryClient.ensureQueryData(
        matchesQueryOptions({ player: id, page: 1 }),
      ),
      context.queryClient.ensureQueryData(playersQueryOptions()),
    ])
  },
  component: PlayerOverviewPage,
})

function pct(n: number, d: number) {
  return Math.round((n / d) * 100)
}

function strongestBucket(lengths: RallyLengths): string | null {
  const buckets = [
    { label: "1–3 shots", w: lengths.short_wins, n: lengths.short_rallies },
    { label: "4–8 shots", w: lengths.medium_wins, n: lengths.medium_rallies },
    { label: "9+ shots", w: lengths.long_wins, n: lengths.long_rallies },
  ].filter((b) => b.n > 0)
  if (buckets.length === 0) return null
  const best = buckets.reduce((a, b) => (b.w / b.n > a.w / a.n ? b : a))
  return best.label
}

function PlayerOverviewPage() {
  const { playerId } = Route.useParams()

  const headline = usePlayerHeadline(playerId, {})
  const serve = useServeStats(playerId, {})
  const errors = useErrorProfile(playerId, {})
  const lengths = useRallyLengths(playerId, {})
  const momentum = useMomentum(playerId, {})
  const players = usePlayers()
  const player = players.data?.find((p) => p.id === playerId)

  if (
    !headline.data ||
    !serve.data ||
    !errors.data ||
    !lengths.data ||
    !momentum.data ||
    !player
  ) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    )
  }

  const h = headline.data
  const s = serve.data
  const e = errors.data
  const l = lengths.data
  const m = momentum.data

  const serveEnough = s.rallies_served >= MIN_RALLIES_FOR_RATE
  const errorsEnough = e.games_played >= MIN_GAMES_FOR_WIN_RATE
  const strongest = strongestBucket(l)

  return (
    <main className="container mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <PlayerHeader
        name={player.name}
        handedness={player.handedness}
        headline={h}
        lengths={l}
      />

      <ProfileStatStrip serve={s} errors={e} lengths={l} momentum={m} />

      <section aria-label="Explore" className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Explore
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <InsightCard
            playerId={playerId}
            category="head-to-head"
            label="Results & form"
            preview={<FormDotsPreview games={h.recent_games} />}
            stat={
              <>
                {h.matches_won}–{h.matches_decided - h.matches_won} matches ·{" "}
                {h.games_won} of {h.games_decided} games
              </>
            }
          />
          <InsightCard
            playerId={playerId}
            category="serve"
            label="Serve"
            preview={<ServeSidePreview serve={s} />}
            stat={
              serveEnough
                ? `${pct(s.serve_wins, s.rallies_served)}% won on serve · ${s.aces} aces`
                : `${s.aces} aces · ${s.double_faults} double faults`
            }
          />
          <InsightCard
            playerId={playerId}
            category="errors"
            label="Errors"
            preview={<ErrorSplitPreview errors={e} />}
            stat={
              errorsEnough
                ? `${(e.unforced_errors / e.games_played).toFixed(1)} unforced per game`
                : `${e.errors_total} errors logged`
            }
          />
          <InsightCard
            playerId={playerId}
            category="rallies"
            label="Rallies"
            preview={<RallyBucketsPreview lengths={l} />}
            stat={
              l.avg_length === null
                ? "Not enough rallies yet"
                : `${l.avg_length.toFixed(1)} shots on average${
                    strongest ? ` · strongest at ${strongest}` : ""
                  }`
            }
          />
          <InsightCard
            playerId={playerId}
            category="momentum"
            label="Momentum"
            preview={<MomentumPhasePreview momentum={m} />}
            stat={`${m.comebacks} ${m.comebacks === 1 ? "comeback" : "comebacks"} · longest streak ${m.longest_streak}`}
          />
        </div>
      </section>

      <PlayerRecentMatches playerId={playerId} />
    </main>
  )
}
