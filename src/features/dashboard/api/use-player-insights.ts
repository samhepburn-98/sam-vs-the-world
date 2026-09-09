import {
  decisiveShotsOptions,
  useDecisiveShots,
} from "@/features/dashboard/api/get-decisive-shots"
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

import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type { InsightFilters } from "@/features/dashboard/schemas/insights"
import type { QueryClient } from "@tanstack/react-query"

/** Warm every insight query for a player into the cache — call it from a
 *  route loader (once per roster player) so the cards come back in the
 *  server-rendered markup instead of painting in after hydration. Mirrors the
 *  six queries the hook below runs (each payload's type differs, so they're
 *  spelled out rather than mapped). */
export function prefetchPlayerInsights(
  queryClient: QueryClient,
  playerId: string,
  filters: InsightFilters = {}
): Promise<unknown> {
  return Promise.all([
    queryClient.ensureQueryData(playerHeadlineOptions(playerId, filters)),
    queryClient.ensureQueryData(serveStatsOptions(playerId, filters)),
    queryClient.ensureQueryData(errorProfileOptions(playerId, filters)),
    queryClient.ensureQueryData(rallyLengthsOptions(playerId, filters)),
    queryClient.ensureQueryData(momentumOptions(playerId, filters)),
    queryClient.ensureQueryData(decisiveShotsOptions(playerId, filters)),
  ])
}

/** The insight payloads behind one player's profile, fetched as a unit. Each
 *  payload arrives independently — PlayerData's fields are all optional, so
 *  consumers render what's in and dash what isn't. Pass an undefined id to
 *  render a slot that isn't picked yet; nothing fetches. */
export function usePlayerInsights(
  playerId: string | undefined,
  filters: InsightFilters = {}
): PlayerData {
  // an unpicked compare slot renders without fetching — the one option this
  // facade needs, and now the one the sibling hooks accept (lib/react-query)
  const queryConfig = { enabled: Boolean(playerId) }
  const id = playerId ?? ""
  const headline = usePlayerHeadline({ playerId: id, filters, queryConfig })
  const serve = useServeStats({ playerId: id, filters, queryConfig })
  const error = useErrorProfile({ playerId: id, filters, queryConfig })
  const rally = useRallyLengths({ playerId: id, filters, queryConfig })
  const momentum = useMomentum({ playerId: id, filters, queryConfig })
  const decisive = useDecisiveShots({ playerId: id, filters, queryConfig })

  return {
    headline: headline.data,
    serve: serve.data,
    error: error.data,
    rally: rally.data,
    momentum: momentum.data,
    decisive: decisive.data,
  }
}
