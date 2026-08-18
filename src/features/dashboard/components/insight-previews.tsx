import { CourtDiagram } from "@/components/court/court-diagram"
import { cn } from "@/lib/utils"

import type {
  ErrorProfile,
  HeadlineGame,
  Momentum,
  RallyLengths,
  ServeStats,
} from "@/features/dashboard/schemas/insights"

// The small visuals that ride inside each profile InsightCard (§4.6, §5.1) —
// a preview of the deep page, drawn only from data the page already has. Each
// stays legible at ~64px and adapts to light/dark via theme tokens.

/** Serve: the court motif with each service box shaded by its win rate. */
export function ServeSidePreview({ serve }: { serve: ServeStats }) {
  const leftShare =
    serve.left_served > 0 ? serve.left_wins / serve.left_served : undefined
  const rightShare =
    serve.right_served > 0 ? serve.right_wins / serve.right_served : undefined
  return (
    <CourtDiagram
      leftShare={leftShare}
      rightShare={rightShare}
      className="h-16 w-11 text-muted-foreground/50"
      label="Serve win rate by court side"
    />
  )
}

/** Errors: one bar split unforced / forced / untagged. */
export function ErrorSplitPreview({ errors }: { errors: ErrorProfile }) {
  const total = Math.max(1, errors.errors_total)
  const seg = (n: number) => `${(n / total) * 100}%`
  return (
    <div className="w-full">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary"
          style={{ width: seg(errors.unforced_errors) }}
        />
        <div
          className="bg-muted-foreground/50"
          style={{ width: seg(errors.forced_errors) }}
        />
        <div
          className="bg-muted"
          style={{ width: seg(errors.untagged_errors) }}
        />
      </div>
      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary" /> Unforced
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-muted-foreground/50" /> Forced
        </span>
      </div>
    </div>
  )
}

/** Rallies: the three length buckets as bars, the biggest emphasised. */
export function RallyBucketsPreview({ lengths }: { lengths: RallyLengths }) {
  const buckets = [
    { label: "1–3", n: lengths.short_rallies },
    { label: "4–8", n: lengths.medium_rallies },
    { label: "9+", n: lengths.long_rallies },
  ]
  const max = Math.max(1, ...buckets.map((b) => b.n))
  return (
    <div className="flex w-full items-end gap-3">
      {buckets.map((b) => (
        <div key={b.label} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex h-12 w-full items-end">
            <div
              className="w-full rounded-t bg-primary/80"
              style={{ height: `${Math.max(8, (b.n / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{b.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Momentum: win share across the three in-game phases (early / mid / close). */
export function MomentumPhasePreview({ momentum: m }: { momentum: Momentum }) {
  const phases = [
    { label: "Early", w: m.early_wins, n: m.early_rallies },
    { label: "Mid", w: m.mid_wins, n: m.mid_rallies },
    { label: "Close", w: m.close_wins, n: m.close_rallies },
  ]
  return (
    <div className="flex w-full items-end gap-3">
      {phases.map((p) => {
        const rate = p.n > 0 ? p.w / p.n : 0
        return (
          <div
            key={p.label}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div className="flex h-12 w-full items-end">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${Math.max(8, rate * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{p.label}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Form: the last few decided games, oldest to newest. */
export function FormDotsPreview({ games }: { games: Array<HeadlineGame> }) {
  // recent_games is newest-first; read a form line oldest-first, left to right
  const form = games
    .filter((g) => g.won !== null)
    .slice(0, 6)
    .reverse()
  if (form.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No decided games yet.</p>
    )
  }
  return (
    <span
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`Recent form, oldest to newest: ${form
        .map((g) => (g.won ? "won" : "lost"))
        .join(", ")}`}
    >
      {form.map((g, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "size-2.5 rounded-full",
            g.won ? "bg-success" : "bg-error"
          )}
        />
      ))}
    </span>
  )
}
