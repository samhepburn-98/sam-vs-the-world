import { cn } from "@/lib/utils"

import type { RallyDraft } from "@/lib/logger/rally-draft"
import type { Score } from "@/lib/scoring"

// Giant score + serving context. Every serve chip — including the serving dot
// itself — is a tappable override of the suggestion (§5.3): the DB stores
// what actually happened, the engine only ever suggests.

interface ScoreHeaderProps {
  p1Name: string
  p2Name: string
  p1Id: string
  score: Score
  gameNumber: number
  rulesLine: string
  draft: RallyDraft
  servesPerPoint: number
  onToggleServer: () => void
  onToggleSide: () => void
  onToggleServeNumber: () => void
}

export function ScoreHeader({
  p1Name,
  p2Name,
  p1Id,
  score,
  gameNumber,
  rulesLine,
  draft,
  servesPerPoint,
  onToggleServer,
  onToggleSide,
  onToggleServeNumber,
}: ScoreHeaderProps) {
  const p1Serving = draft.serverId === p1Id

  const chips = (
    <span className="mt-1.5 flex justify-center gap-1.5">
      <button
        type="button"
        onClick={onToggleSide}
        className="border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 cursor-pointer rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors"
      >
        {draft.serveSide} box
      </button>
      {servesPerPoint === 2 && (
        <button
          type="button"
          onClick={onToggleServeNumber}
          className="text-muted-foreground hover:text-foreground cursor-pointer rounded-full border px-2 py-0.5 text-[11px] transition-colors"
        >
          {draft.serveNumber === 1 ? "1st serve" : "2nd serve"}
        </button>
      )}
    </span>
  )

  const side = (name: string, points: number, serving: boolean) => (
    <div className="text-center">
      <button
        type="button"
        onClick={onToggleServer}
        title="Tap to change the server"
        className={cn(
          "cursor-pointer text-sm font-bold tracking-wide uppercase transition-colors",
          serving ? "" : "text-muted-foreground",
        )}
      >
        {name}
        {serving && <span className="text-primary ml-1.5">●</span>}
      </button>
      <p
        className={cn(
          "mt-1 text-6xl font-bold tabular-nums sm:text-7xl",
          serving ? "" : "text-muted-foreground",
        )}
      >
        {points}
      </p>
      {serving ? chips : (
        <span className="text-muted-foreground/60 mt-1.5 block text-[11px]">
          receiving
        </span>
      )}
    </div>
  )

  return (
    <section aria-label="Score">
      <p className="text-muted-foreground mb-3 text-center text-xs tracking-widest uppercase">
        Game {gameNumber} · {rulesLine}
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {side(p1Name, score.p1, p1Serving)}
        <span className="text-muted-foreground/50 pb-4 text-3xl">–</span>
        {side(p2Name, score.p2, !p1Serving)}
      </div>
    </section>
  )
}
