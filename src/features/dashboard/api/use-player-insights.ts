import { useQuery } from "@tanstack/react-query"

import { decisiveShotsOptions } from "@/features/dashboard/api/get-decisive-shots"
import { errorProfileOptions } from "@/features/dashboard/api/get-error-profile"
import { momentumOptions } from "@/features/dashboard/api/get-momentum"
import { playerHeadlineOptions } from "@/features/dashboard/api/get-player-headline"
import { rallyLengthsOptions } from "@/features/dashboard/api/get-rally-lengths"
import { serveStatsOptions } from "@/features/dashboard/api/get-serve-stats"

import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type { InsightFilters } from "@/features/dashboard/schemas/insights"

/** The insight payloads behind one player's profile, fetched as a unit. Each
 *  payload arrives independently — PlayerData's fields are all optional, so
 *  consumers render what's in and dash what isn't. Pass an undefined id to
 *  render a slot that isn't picked yet; nothing fetches. */
export function usePlayerInsights(
  playerId: string | undefined,
  filters: InsightFilters = {}
): PlayerData {
  const enabled = Boolean(playerId)
  const id = playerId ?? ""
  const headline = useQuery({ ...playerHeadlineOptions(id, filters), enabled })
  const serve = useQuery({ ...serveStatsOptions(id, filters), enabled })
  const error = useQuery({ ...errorProfileOptions(id, filters), enabled })
  const rally = useQuery({ ...rallyLengthsOptions(id, filters), enabled })
  const momentum = useQuery({ ...momentumOptions(id, filters), enabled })
  const decisive = useQuery({ ...decisiveShotsOptions(id, filters), enabled })

  return {
    headline: headline.data,
    serve: serve.data,
    error: error.data,
    rally: rally.data,
    momentum: momentum.data,
    decisive: decisive.data,
  }
}
