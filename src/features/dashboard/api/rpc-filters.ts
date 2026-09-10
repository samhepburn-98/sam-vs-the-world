import type { InsightFilters } from "@/features/dashboard/schemas/insights"

// Every insight RPC takes the same four cross-cutting filters (§3.6) as
// `p_*` parameters, so the mapping from the client-side filter object onto
// them belongs to the whole api/ folder rather than to whichever request
// happened to need it first. Omitted filters fall through to the SQL
// defaults (no filter), which is why each one maps to undefined and not
// null — PostgREST drops undefined keys, and a null would mean "match null".

export function toRpcFilters(filters: InsightFilters) {
  return {
    p_opponent_id: filters.opponentId ?? undefined,
    p_ball_type: filters.ballType ?? undefined,
    p_date_from: filters.dateFrom ?? undefined,
    p_date_to: filters.dateTo ?? undefined,
  }
}
