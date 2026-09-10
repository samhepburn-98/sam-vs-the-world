import { Link } from "@tanstack/react-router"

import { usePlayerMatchHistory } from "@/features/dashboard/api/get-player-match-history"
import { MatchHistory } from "@/features/dashboard/components/profile/match-history"
import { toHistoryMatches } from "@/features/dashboard/lib/match-history"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlayers } from "@/lib/api/get-players"

// The profile's match history, wired: latest matches for this player with
// their per-game scores, and a fold link to the full filtered log when
// there's more than one page's worth. Fetching lives here so MatchHistory
// itself stays a pure renderer of rows.

export function PlayerMatchHistory({ playerId }: { playerId: string }) {
  const history = usePlayerMatchHistory({ playerId })
  const players = usePlayers()

  if (!history.data || !players.data) {
    return <Skeleton className="h-40 w-full" />
  }

  const nameOf = (id: string) =>
    players.data.find((p) => p.id === id)?.name ?? "Unknown"
  const rows = toHistoryMatches(
    playerId,
    history.data.matches,
    history.data.games,
    nameOf
  )

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No matches logged yet.</p>
    )
  }

  const remaining = history.data.total - rows.length
  return (
    <>
      <MatchHistory matches={rows} />
      {remaining > 0 && (
        <p className="mt-4 text-xs">
          <Link
            to="/matches"
            search={{ player: playerId, page: 1 }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            See all {history.data.total} matches
          </Link>
        </p>
      )}
    </>
  )
}
