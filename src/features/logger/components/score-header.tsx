import { Kbd } from "@/components/ui/kbd"
import { HOTKEY_HINTS } from "@/features/logger/logic/hotkeys"
import { cn } from "@/lib/utils"

import type { RallyDraft } from "@/lib/rally/rally-draft"
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
    <span className="mt-1 flex justify-center gap-1.5">
      <button
        type="button"
        onClick={onToggleSide}
        className="cursor-pointer border border-primary/40 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
      >
        {draft.serveSide === "left" ? "Left" : "Right"} box{" "}
        <Kbd className="border-primary/30">{HOTKEY_HINTS.serveSide}</Kbd>
      </button>
      {servesPerPoint === 2 && (
        <button
          type="button"
          onClick={onToggleServeNumber}
          className="cursor-pointer border px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {draft.serveNumber === 1 ? "1st serve" : "2nd serve"}{" "}
          <Kbd>{HOTKEY_HINTS.serveNumber}</Kbd>
        </button>
      )}
    </span>
  )

  // each side wears its own colour — the score always reads ember vs blue,
  // and the serve is marked by the dot, not by dimming the receiver
  const side = (
    name: string,
    points: number,
    serving: boolean,
    colorClass: string
  ) => (
    <div className="text-center">
      <button
        type="button"
        onClick={onToggleServer}
        title="Tap to change the server"
        className="cursor-pointer font-heading text-sm font-bold tracking-wide uppercase transition-colors"
      >
        {name}
        {serving && <span className="ml-1.5 text-foreground">●</span>}
      </button>
      <p
        className={cn(
          "mt-1 font-heading text-6xl font-bold tabular-nums sm:text-7xl",
          colorClass
        )}
      >
        {points}
      </p>
      {serving ? (
        <>
          <span className="mt-1.5 block font-heading text-[11px] font-bold tracking-[0.16em] uppercase">
            Serving
          </span>
          {chips}
        </>
      ) : (
        <span className="mt-1.5 block font-heading text-[11px] font-bold tracking-[0.16em] text-muted-foreground/60 uppercase">
          Receiving
        </span>
      )}
    </div>
  )

  return (
    <section aria-label="Score">
      <p className="mb-3 text-center text-xs tracking-widest text-muted-foreground uppercase">
        Game {gameNumber} · {rulesLine}
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {side(p1Name, score.p1, p1Serving, "text-primary-strong")}
        <span className="pb-4 text-3xl text-muted-foreground/50">–</span>
        {side(p2Name, score.p2, !p1Serving, "text-p2-strong")}
      </div>
    </section>
  )
}
