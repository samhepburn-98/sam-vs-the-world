import { MatchLogger } from "@/features/logger/components/match-logger"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useMatchDetail } from "@/lib/api/get-match-detail"

import type { PlayerSummary } from "@/lib/schemas/player"
import type { WriteQueue } from "@/lib/api/write-queue"

// The logging surface's entry point (§5.3): fetch the match, then hand it to
// MatchLogger. Kept apart so the states that are *not* logging — pending,
// failed, a match with no games — do not have to be read past to reach the
// component that does the work.

interface LoggingShellProps {
  matchId: string
  players: Array<PlayerSummary>
  queue: WriteQueue
  /** known for fresh matches; resumed matches recover it from rally 1 */
  firstServerId?: string
  onExit: () => void
}

export function LoggingShell({
  matchId,
  players,
  queue,
  firstServerId,
  onExit,
}: LoggingShellProps) {
  const detail = useMatchDetail({ matchId })

  if (detail.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }
  if (detail.isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-destructive">Couldn't load the match.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void detail.refetch()}
        >
          Retry
        </Button>
      </div>
    )
  }

  if (detail.data.games.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        This match has no games — reopen it after checking /manage.
      </p>
    )
  }

  return (
    <MatchLogger
      key={matchId}
      match={detail.data}
      players={players}
      queue={queue}
      firstServerId={firstServerId}
      onExit={onExit}
    />
  )
}
