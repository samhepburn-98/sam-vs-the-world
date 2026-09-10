import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

import type { RecordTileDisplay } from "@/features/dashboard/lib/record-display"

// One record on the wall: an accent-bar graphic that shouts the figure in
// the display face, names the record, then captions it. The holder wears
// the side they held IN THE RECORD'S MATCH (the colour law, anchored — the
// tile agrees with the match page it links to); a match-owned record has
// no holder and wears a neutral bar. The whole tile links to its match.

export function RecordTile({
  record,
  side: sideOverride,
  className,
}: {
  record: RecordTileDisplay
  /** Override for perspective pages — a profile paints every held record in
   *  the player's own ember. Defaults to the record's match-anchored side. */
  side?: "p1" | "p2"
  className?: string
}) {
  const side = sideOverride ?? record.side
  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: record.matchId }}
      search={{ rally: undefined }}
      className={cn(
        "block border-l-4 bg-card px-3.5 py-3 transition-colors hover:bg-accent",
        side === "p1"
          ? "border-primary"
          : side === "p2"
            ? "border-p2"
            : "border-border",
        className
      )}
    >
      <p className="font-heading text-3xl leading-none font-extrabold tabular-nums">
        {record.value}
        {record.unit && (
          <span className="ml-1.5 text-sm font-bold tracking-[0.08em] text-muted-foreground uppercase">
            {record.unit}
          </span>
        )}
      </p>
      <p className="mt-1.5 font-heading text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {record.title}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        <span
          className={cn(
            "font-medium",
            record.isHolder && side === "p1" && "text-primary-strong",
            record.isHolder && side === "p2" && "text-p2-strong"
          )}
        >
          {record.lead}
        </span>
        {" · "}
        {record.rest}
      </p>
    </Link>
  )
}

// The wall: a responsive grid of tiles, each in its match-anchored side.
// A profile passes side="p1" because there every record on show is the
// player's own.

export function RecordsWall({
  records,
  side,
  className,
}: {
  records: Array<RecordTileDisplay>
  /** Repaint every tile in one side, for a page written from one player's
   *  point of view. Omit on a neutral wall so each tile keeps its own. */
  side?: "p1" | "p2"
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-1.5 sm:grid-cols-3", className)}>
      {records.map((record) => (
        <RecordTile key={record.key} record={record} side={side} />
      ))}
    </div>
  )
}
