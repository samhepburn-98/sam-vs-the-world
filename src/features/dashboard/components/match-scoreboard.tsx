import { TrophyIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// The match page's headline (§5.2): who won, answered before anything else.
// The winner carries three cues that survive colour-blindness — the trophy,
// full-ink weight against the loser's muted name, and the heavier score digit.

interface MatchScoreboardProps {
  p1Name: string
  p2Name: string
  gamesWonP1: number
  gamesWonP2: number
  /** null = no leader (a level casual session) */
  winner: "p1" | "p2" | null
}

export function MatchScoreboard({
  p1Name,
  p2Name,
  gamesWonP1,
  gamesWonP2,
  winner,
}: MatchScoreboardProps) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <PlayerSide side="p1" name={p1Name} won={winner === "p1"} />
      <p
        aria-hidden
        className="font-heading text-5xl tracking-tight tabular-nums"
      >
        <span
          className={cn(
            winner === "p2" ? "font-medium text-muted-foreground" : "font-bold"
          )}
        >
          {gamesWonP1}
        </span>
        <span className="mx-2 font-medium text-muted-foreground">–</span>
        <span
          className={cn(
            winner === "p1" ? "font-medium text-muted-foreground" : "font-bold"
          )}
        >
          {gamesWonP2}
        </span>
      </p>
      <PlayerSide side="p2" name={p2Name} won={winner === "p2"} />
    </div>
  )
}

function PlayerSide({
  side,
  name,
  won,
}: {
  side: "p1" | "p2"
  name: string
  won: boolean
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2.5",
        side === "p2" && "flex-row-reverse text-right"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-2.5 shrink-0 rounded-full",
          side === "p1" ? "bg-primary" : "bg-foreground"
        )}
      />
      <span
        className={cn(
          "font-heading text-xl font-bold tracking-tight sm:text-2xl",
          !won && "text-muted-foreground"
        )}
      >
        {name}
      </span>
      {won && (
        <>
          <TrophyIcon aria-hidden className="size-4 shrink-0 text-primary" />
          <span className="sr-only">Winner</span>
        </>
      )}
    </span>
  )
}
