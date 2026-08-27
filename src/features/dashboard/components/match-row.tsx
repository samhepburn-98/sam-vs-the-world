import { Link } from "@tanstack/react-router"

import { BallDots } from "@/components/broadcast/ball-dots"
import { cn } from "@/lib/utils"

import type { BallType } from "@/lib/schemas/enums"

// The match row: one broadcast result graphic per match — names in the
// display face with the winner's name in their side colour (the same colour
// law as the score), the meta line beneath, the score on the right. No
// W/L/D chip here: a neutral list has no "this player" to read it from, so
// perspective chips live only where one exists (form guides, profiles).
// The home recent-matches list and the full history render the same row,
// so a match never looks different in two places.

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

export function MatchRow({
  matchId,
  date,
  name1,
  name2,
  score1,
  score2,
  outcome,
  venue,
  format,
  ball,
}: {
  matchId: string
  date: string
  name1: string
  name2: string
  score1: number | null
  score2: number | null
  outcome: "p1" | "p2" | "draw" | "pending"
  venue?: string | null
  /** Best-of format; null is a casual match. Omit to hide the format. */
  format?: number | null
  ball?: BallType | null
}) {
  const hasScore = score1 !== null && score2 !== null
  const meta = [
    formatDate(date),
    venue ?? null,
    format === undefined
      ? null
      : format === null
        ? "Casual"
        : `Best of ${format}`,
  ].filter(Boolean)

  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId }}
      search={{ rally: undefined }}
      className="flex items-center justify-between gap-4 bg-card px-3.5 py-2.5 transition-colors hover:bg-accent"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex items-baseline gap-2">
          <span className="truncate font-heading text-lg leading-none font-extrabold uppercase">
            <span className={cn(outcome === "p1" && "text-primary-strong")}>
              {name1}
            </span>{" "}
            <span className="font-bold text-muted-foreground">v</span>{" "}
            <span className={cn(outcome === "p2" && "text-p2-strong")}>
              {name2}
            </span>
          </span>
          {outcome === "pending" && (
            <span className="font-heading text-[11px] font-bold tracking-[0.1em] text-warning uppercase">
              In play
            </span>
          )}
          {outcome === "draw" && (
            <span className="font-heading text-[11px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
              Drawn
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {meta.join(" · ")}
          {ball && <BallDots ball={ball} />}
        </span>
      </span>
      {hasScore && (
        <span
          className={cn(
            "shrink-0 font-heading text-xl font-extrabold tabular-nums",
            outcome === "p1" && "text-primary-strong",
            outcome === "p2" && "text-p2-strong"
          )}
        >
          {score1}–{score2}
        </span>
      )}
    </Link>
  )
}
