import { z } from "zod"

import { ballType } from "@/lib/schemas/enums"

import type { InsightFilters } from "@/lib/schemas/insights"

// The cross-cutting filters (§3.6) live in the URL so every filtered view is
// shareable and the filters persist across the drill chain (§6.1). This is
// the one contract the player, category, and compare routes all validate
// their search params against — `?vs=…&ball=…&from=…&to=…`.
//
// `.catch(undefined)` on each field means a hand-edited or stale param
// degrades to "no filter" rather than throwing the route.

export const insightSearch = z.object({
  vs: z.string().uuid().optional().catch(undefined),
  ball: ballType.optional().catch(undefined),
  from: z.string().date().optional().catch(undefined),
  to: z.string().date().optional().catch(undefined),
})

export type InsightSearch = z.infer<typeof insightSearch>

/** URL params → the shape the RPC hooks take. */
export function searchToFilters(search: InsightSearch): InsightFilters {
  return {
    opponentId: search.vs ?? null,
    ballType: search.ball ?? null,
    dateFrom: search.from ?? null,
    dateTo: search.to ?? null,
  }
}

/** True when any filter is active — for showing a "clear" affordance. */
export function hasActiveFilters(search: InsightSearch): boolean {
  return Boolean(search.vs ?? search.ball ?? search.from ?? search.to)
}
