import { createFileRoute } from "@tanstack/react-router"

import { CATEGORIES } from "@/features/dashboard/categories"
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
import {
  CardStat,
  CategoryCard,
} from "@/features/dashboard/components/category-card"
import { FilterBar } from "@/features/dashboard/components/filter-bar"
import { PlayerHeader } from "@/features/dashboard/components/player-header"
import {
  insightSearch,
  searchToFilters,
} from "@/features/dashboard/utils/insight-filters"
import {
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/utils/insight-thresholds"
import { Skeleton } from "@/components/ui/skeleton"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { ReactNode } from "react"

// Player overview (§5.1): the gateway to the category pages. Loader-prefetched
// so the header and cards are server-rendered; the filter bar drives the URL,
// and those filters ride the card links down into the category detail pages.

export const Route = createFileRoute("/players/$playerId/")({
  validateSearch: (search) => insightSearch.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const id = params.playerId
    const filters = searchToFilters(deps)
    await Promise.all([
      context.queryClient.ensureQueryData(playerHeadlineOptions(id, filters)),
      context.queryClient.ensureQueryData(serveStatsOptions(id, filters)),
      context.queryClient.ensureQueryData(errorProfileOptions(id, filters)),
      context.queryClient.ensureQueryData(rallyLengthsOptions(id, filters)),
      context.queryClient.ensureQueryData(momentumOptions(id, filters)),
      context.queryClient.ensureQueryData(playersQueryOptions()),
    ])
  },
  component: PlayerOverviewPage,
})

function pct(n: number, d: number) {
  return Math.round((n / d) * 100)
}

function PlayerOverviewPage() {
  const { playerId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const filters = searchToFilters(search)

  const headline = usePlayerHeadline(playerId, filters)
  const serve = useServeStats(playerId, filters)
  const errors = useErrorProfile(playerId, filters)
  const lengths = useRallyLengths(playerId, filters)
  const momentum = useMomentum(playerId, filters)
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

  const cardBody: Record<string, ReactNode> = {
    "head-to-head": (
      <CardStat
        belowSample={headline.data.games_decided < MIN_GAMES_FOR_WIN_RATE}
        sample={headline.data.games_decided}
        value={`${pct(headline.data.games_won, headline.data.games_decided)}%`}
        hint={`${headline.data.games_won} of ${headline.data.games_decided} games`}
      />
    ),
    serve: (
      <CardStat
        belowSample={serve.data.rallies_served < MIN_RALLIES_FOR_RATE}
        sample={serve.data.rallies_served}
        value={`${pct(serve.data.serve_wins, serve.data.rallies_served)}%`}
        hint="points won on serve"
      />
    ),
    errors: (
      <CardStat
        belowSample={errors.data.games_played < MIN_GAMES_FOR_WIN_RATE}
        sample={errors.data.games_played}
        value={(
          errors.data.unforced_errors / errors.data.games_played
        ).toFixed(1)}
        hint="unforced per game"
      />
    ),
    rallies: (
      <CardStat
        belowSample={lengths.data.total_rallies < MIN_RALLIES_FOR_RATE}
        sample={lengths.data.total_rallies}
        value={lengths.data.avg_length?.toFixed(1) ?? "—"}
        hint="shots per rally"
      />
    ),
    momentum: (
      <CardStat
        belowSample={false}
        sample={0}
        value={momentum.data.comebacks}
        hint={momentum.data.comebacks === 1 ? "comeback" : "comebacks"}
      />
    ),
  }

  return (
    <main className="container mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <PlayerHeader
        name={player.name}
        handedness={player.handedness}
        headline={headline.data}
        lengths={lengths.data}
      />

      <FilterBar
        value={search}
        onChange={(next) => void navigate({ search: next })}
        excludePlayerId={playerId}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <CategoryCard
            key={c.key}
            playerId={playerId}
            category={c.key}
            label={c.label}
            blurb={c.blurb}
            search={search}
          >
            {cardBody[c.key]}
          </CategoryCard>
        ))}
      </section>
    </main>
  )
}
