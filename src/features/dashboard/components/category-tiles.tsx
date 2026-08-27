import { CATEGORIES } from "@/features/dashboard/lib/categories"
import { InsightCard } from "@/features/dashboard/components/insight-card"
import {
  ErrorSplitPreview,
  MomentumPhasePreview,
  RallyBucketsPreview,
  ServeSidePreview,
} from "@/features/dashboard/components/insight-previews"
import {
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/lib/insight-thresholds"
import { FormGuide } from "@/components/broadcast/form-guide"

import type { CategoryKey } from "@/features/dashboard/lib/categories"
import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type { HeadlineGame } from "@/features/dashboard/schemas/insights"
import type { ReactNode } from "react"

// The five doors off the profile (§3.3, §5.1). The tabs above tell the
// all-time story; these open the category pages, where the filters and the
// rallies behind each number live. Each tile previews what's inside — a small
// visual plus a line of real numbers — so the row reads as five graphics, not
// five buttons. All-time here: filtering starts on the page a tile opens.

/** The number is only ever spoken with its receipt, and only above the
 *  sample floor (§3.5) — a tile shows "not enough data yet" over a figure it
 *  can't stand behind. */
function Rate({ won, of, min }: { won: number; of: number; min: number }) {
  if (of < min)
    return (
      <>
        Not enough data yet <span className="tabular-nums">(n={of})</span>
      </>
    )
  return (
    <>
      <span className="tabular-nums">{Math.round((won / of) * 100)}%</span> ·{" "}
      <span className="tabular-nums">
        {won} of {of}
      </span>
    </>
  )
}

/** The quiet dash for a payload that hasn't landed yet — never a zero, which
 *  would read as a real measurement. */
const PENDING = <span className="text-muted-foreground/60">—</span>

/** recent_games is newest-first and includes undecided games; the form guide
 *  wants decided results oldest-first. Undecided games are dropped rather
 *  than drawn as draws — a tied game isn't a result. */
function toForm(games: Array<HeadlineGame>): Array<"w" | "l"> {
  return games
    .filter((g) => g.won !== null)
    .slice(0, 5)
    .reverse()
    .map((g) => (g.won ? "w" : "l"))
}

function buildTile(
  key: CategoryKey,
  data: PlayerData
): { preview: ReactNode; stat: ReactNode } {
  const { headline: h, serve: s, error: e, rally: r, momentum: m } = data

  switch (key) {
    case "head-to-head":
      return {
        preview: h ? <FormGuide results={toForm(h.recent_games)} /> : null,
        stat: h ? (
          <>
            <span className="tabular-nums">
              {h.games_won}–{h.games_decided - h.games_won}
            </span>{" "}
            in games ·{" "}
            <span className="tabular-nums">
              {h.matches_won}–{h.matches_decided - h.matches_won}
            </span>{" "}
            in matches
          </>
        ) : (
          PENDING
        ),
      }

    case "serve":
      return {
        preview: s ? <ServeSidePreview serve={s} /> : null,
        stat: s ? (
          <>
            Serves won:{" "}
            <Rate
              won={s.serve_wins}
              of={s.rallies_served}
              min={MIN_RALLIES_FOR_RATE}
            />
          </>
        ) : (
          PENDING
        ),
      }

    case "errors":
      return {
        preview: e ? <ErrorSplitPreview errors={e} /> : null,
        // games_played gates the per-game average and guards the divide —
        // a player with no counted games has no rate, not an infinite one
        stat: !e ? (
          PENDING
        ) : e.games_played < MIN_GAMES_FOR_WIN_RATE ? (
          <>
            Not enough data yet{" "}
            <span className="tabular-nums">(n={e.games_played})</span>
          </>
        ) : (
          <>
            <span className="tabular-nums">
              {(e.unforced_errors / e.games_played).toFixed(1)}
            </span>{" "}
            unforced per game ·{" "}
            <span className="tabular-nums">{e.errors_total}</span> in all
          </>
        ),
      }

    case "rallies":
      return {
        preview: r ? <RallyBucketsPreview lengths={r} /> : null,
        stat: !r ? (
          PENDING
        ) : r.avg_length === null ? (
          <>No tagged rally lengths yet</>
        ) : (
          <>
            <span className="tabular-nums">{r.avg_length.toFixed(1)}</span>{" "}
            shots on average · longest{" "}
            <span className="tabular-nums">{r.longest}</span>
          </>
        ),
      }

    case "momentum":
      return {
        preview: m ? <MomentumPhasePreview momentum={m} /> : null,
        stat: m ? (
          <>
            <span className="tabular-nums">{m.comebacks}</span>{" "}
            {m.comebacks === 1 ? "comeback" : "comebacks"} · longest streak{" "}
            <span className="tabular-nums">{m.longest_streak}</span>
          </>
        ) : (
          PENDING
        ),
      }
  }
}

export function CategoryTiles({
  playerId,
  data,
}: {
  playerId: string
  data: PlayerData
}) {
  return (
    // two-up on a phone, not stacked: five full-width tiles would put a
    // screen and a half of scrolling between the hero and the tabs
    <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-5">
      {CATEGORIES.map((category) => {
        const { preview, stat } = buildTile(category.key, data)
        return (
          <InsightCard
            key={category.key}
            playerId={playerId}
            category={category.key}
            label={category.label}
            preview={preview}
            stat={stat}
          />
        )
      })}
    </div>
  )
}
