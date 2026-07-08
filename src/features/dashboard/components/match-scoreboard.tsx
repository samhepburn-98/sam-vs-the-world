import { TrophyIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// The match page's headline (§5.2): who won, answered before anything else.
// The winner is marked three ways — trophy icon, the word "Winner", and name
// weight — so the call never rests on colour alone.

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
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
      <PlayerSide side="p1" name={p1Name} won={winner === "p1"} />
      <p
        aria-hidden
        className="font-heading text-5xl font-bold tracking-tight tabular-nums"
      >
        {gamesWonP1}
        <span className="text-muted-foreground mx-2">–</span>
        {gamesWonP2}
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
    <div
      className={cn(
        "flex flex-col items-start gap-1.5 pt-2",
        side === "p2" && "items-end text-right",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-2 text-sm",
          side === "p2" && "flex-row-reverse",
          won ? "font-semibold" : "text-muted-foreground",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            side === "p1" ? "bg-primary" : "bg-foreground",
          )}
        />
        {name}
      </span>
      {won && (
        <span className="text-muted-foreground ring-foreground/10 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1">
          <TrophyIcon aria-hidden className="size-3" />
          Winner
        </span>
      )}
    </div>
  )
}
