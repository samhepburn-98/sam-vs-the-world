import { CourtEmptyMedia } from "@/components/court/court-empty"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

import type { MatchSummary } from "@/lib/schemas/match"
import type { PlayerSummary } from "@/lib/schemas/player"

interface RecentMatchesProps {
  matches: Array<MatchSummary>
  players: Array<PlayerSummary>
  onOpen: (matchId: string) => void
}

// Every match is finished-as-logged (§2.6) — "resume" is just reopening one
// to append or fix. No in-progress state exists.
export function RecentMatches({
  matches,
  players,
  onOpen,
}: RecentMatchesProps) {
  const nameOf = (id: string) =>
    players.find((p) => p.id === id)?.name ?? "Unknown"

  if (matches.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <CourtEmptyMedia />
          <EmptyTitle className="font-heading">No matches yet</EmptyTitle>
          <EmptyDescription>
            Set up the first match above and start logging.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <ul className="divide-y rounded-lg border">
      {matches.map((m) => (
        <li key={m.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
          <span className="w-24 shrink-0 text-muted-foreground tabular-nums">
            {m.date}
          </span>
          <span className="flex-1 truncate">
            {nameOf(m.player1_id)} vs {nameOf(m.player2_id)}
          </span>
          <span className="text-xs text-muted-foreground">
            {m.format ? `best of ${m.format}` : "casual"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpen(m.id)}
          >
            Open
          </Button>
        </li>
      ))}
    </ul>
  )
}
