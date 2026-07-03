import { Button } from "@/components/ui/button"

// The game-over banner (§5.3): fires when the derived score crosses the
// target per the tiebreak hint — a SUGGESTION, never a gate. Casual play can
// keep logging right past it; the derivation doesn't care (§7.7 tier 3).

interface GameOverBannerProps {
  gameNumber: number
  gameWinnerName: string
  scoreline: string
  /** set when this game clinches the match (best-of only) — hides start-next */
  matchWinnerName?: string
  onStartNextGame: () => void
  onFinishMatch: () => void
}

export function GameOverBanner({
  gameNumber,
  gameWinnerName,
  scoreline,
  matchWinnerName,
  onStartNextGame,
  onFinishMatch,
}: GameOverBannerProps) {
  return (
    <div
      role="status"
      className="border-primary/40 bg-primary/5 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3"
    >
      <p className="flex-1 text-sm">
        <span className="font-bold">
          Game {gameNumber} to {gameWinnerName}
        </span>
        <span className="text-muted-foreground"> · {scoreline}</span>
        {matchWinnerName ? (
          <span className="block font-bold">
            {matchWinnerName} takes the match
          </span>
        ) : (
          <span className="text-muted-foreground block text-xs">
            or keep logging — the score is derived, not enforced
          </span>
        )}
      </p>
      {!matchWinnerName && (
        <Button type="button" size="sm" onClick={onStartNextGame}>
          Start game {gameNumber + 1} — {gameWinnerName} serves
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant={matchWinnerName ? "default" : "outline"}
        onClick={onFinishMatch}
      >
        Finish match
      </Button>
    </div>
  )
}
