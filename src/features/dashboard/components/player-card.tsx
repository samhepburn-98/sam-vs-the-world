import { Link } from "@tanstack/react-router"
import { CheckIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MIN_GAMES_FOR_WIN_RATE } from "@/features/dashboard/utils/insight-thresholds"
import { cn } from "@/lib/utils"

import type { RosterHeadline } from "@/features/dashboard/schemas/insights"

// The roster card (§6.1): win rate with its denominator, a form line of the
// last few game results, and the games record — all game-level, decided
// games only. The card links to the player page; the corner control selects
// it for a side-by-side compare without navigating.

interface PlayerCardProps {
  player: RosterHeadline
  selected: boolean
  onToggleSelect: () => void
}

export function PlayerCard({ player, selected, onToggleSelect }: PlayerCardProps) {
  const { games_won, games_decided } = player
  const enough = games_decided >= MIN_GAMES_FOR_WIN_RATE
  const losses = games_decided - games_won
  // recent_games is newest-first; a form line reads left-to-right, oldest-first
  const form = player.recent_games.slice(0, 5).reverse()

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md",
        selected && "ring-2 ring-primary",
      )}
    >
      <Button
        type="button"
        variant={selected ? "default" : "outline"}
        size="icon-sm"
        aria-label={selected ? `Deselect ${player.name}` : `Select ${player.name} to compare`}
        aria-pressed={selected}
        className="absolute top-3 right-3 z-10 rounded-full"
        onClick={onToggleSelect}
      >
        {selected && <CheckIcon />}
      </Button>

      <Link
        to="/players/$playerId"
        params={{ playerId: player.player_id }}
        className="flex flex-col gap-3 p-6"
      >
        <div className="flex items-center gap-2 pr-8">
          <h3 className="font-heading truncate text-lg font-bold">
            {player.name}
          </h3>
          {player.handedness && (
            <span
              className="text-muted-foreground text-xs"
              title={`${player.handedness === "left" ? "Left" : "Right"}-handed`}
            >
              {player.handedness === "left" ? "LH" : "RH"}
            </span>
          )}
        </div>

        {enough ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tabular-nums">
              {Math.round((games_won / games_decided) * 100)}%
            </span>
            <span className="text-muted-foreground text-sm tabular-nums">
              · {games_won} of {games_decided}
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Not enough data yet{" "}
            <span className="tabular-nums">(n={games_decided})</span>
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm tabular-nums">
            {games_won} W · {losses} L
          </span>
          {form.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Form</span>
              <span className="flex items-center gap-1" aria-label="Recent form">
                {form.map((g, i) => (
                  <span
                    key={i}
                    title={
                      g.won === null ? "Undecided" : g.won ? "Won" : "Lost"
                    }
                    className={cn(
                      "size-2 rounded-full",
                      g.won === null
                        ? "bg-muted-foreground/40"
                        : g.won
                          ? "bg-emerald-500"
                          : "bg-red-500",
                    )}
                  />
                ))}
              </span>
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
