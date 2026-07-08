import { cn } from "@/lib/utils"

import type { RallyRow } from "@/lib/rally/rally-draft"
import type { ReactNode } from "react"

// The shared rally timeline (§5.3, §5.2): two-sided — each rally sits on its
// winner's side with the running score in the spine; lets are neutral
// hash-marks that visibly don't advance it. Newest at top. The same component
// serves the logger (editable: click a row to edit) and match detail
// (read-only). Scores are derived from the rows on every render — an edited
// row recomputes everything downstream, exactly like the DB views.

/** The rally's outcome as a human phrase — "Unforced error · tin", not a
 *  column dump of raw enum values. */
export function outcomeLine(row: RallyRow): string {
  const detail = row.error_detail?.replace("_", " ")
  const shots =
    row.shot_count === null
      ? null
      : `${row.shot_count} shot${row.shot_count === 1 ? "" : "s"}`
  switch (row.end_reason) {
    case "winner":
    case "ace": {
      const head = row.end_reason === "ace" ? "Ace" : "Winner"
      return [head, row.shot_type, shots].filter(Boolean).join(" · ")
    }
    case "error": {
      const head =
        row.forced === null
          ? "Error"
          : row.forced
            ? "Forced error"
            : "Unforced error"
      return [head, detail, shots].filter(Boolean).join(" · ")
    }
    case "stroke":
      return ["Stroke", shots].filter(Boolean).join(" · ")
    case "serve_fault":
      return [row.serve_number === 2 ? "Double fault" : "Serve fault", detail]
        .filter(Boolean)
        .join(" · ")
    case "let":
      return "Let"
  }
}

interface RallyTimelineProps {
  rows: Array<RallyRow>
  p1Id: string
  p1Name: string
  p2Name: string
  servesPerPoint: number
  editable?: boolean
  /** row currently being edited — its editor renders in place of the row */
  editingId?: string | null
  /** row to mark out visually — a deep link's landing spot (§5.2) */
  highlightId?: string | null
  /** sticky who's-who header — for long lists far from any scoreboard */
  showNames?: boolean
  onRowClick?: (row: RallyRow) => void
  renderEditor?: (row: RallyRow) => ReactNode
}

export function RallyTimeline({
  rows,
  p1Id,
  p1Name,
  p2Name,
  servesPerPoint,
  editable = false,
  editingId = null,
  highlightId = null,
  showNames = false,
  onRowClick,
  renderEditor,
}: RallyTimelineProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground/60">
        Rallies appear here as you log them.
      </p>
    )
  }

  // running score after each rally, chronological — lets contribute nothing
  let p1 = 0
  let p2 = 0
  const scored = rows.map((row) => {
    if (row.winner_id !== null) {
      if (row.winner_id === p1Id) p1 += 1
      else p2 += 1
    }
    return { row, score: { p1, p2 } }
  })

  const serveLine = (row: RallyRow) => {
    const server = row.server_id === p1Id ? p1Name : p2Name
    const parts = [`${server} served`, `${row.serve_side} box`]
    if (servesPerPoint === 2) {
      parts.push(row.serve_number === 1 ? "1st serve" : "2nd serve")
    }
    return parts.join(" · ")
  }

  return (
    <div className="flex flex-col gap-1">
      {showNames && (
        <div className="sticky top-0 z-10 grid grid-cols-[1fr_3.5rem_1fr] items-center gap-2 bg-background/95 px-2 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="flex items-center justify-end gap-1.5">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            {p1Name}
          </span>
          <span aria-hidden />
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-1.5 rounded-full bg-foreground" />
            {p2Name}
          </span>
        </div>
      )}
      <ol aria-label="Rally timeline" className="flex flex-col gap-1">
        {scored
          .slice()
          .reverse()
          .map(({ row, score }) => {
            if (editingId === row.id && renderEditor) {
              return <li key={row.id}>{renderEditor(row)}</li>
            }

            const isLet = row.end_reason === "let"
            const p1Won = row.winner_id === p1Id
            const cell = (
              <>
                <span className="font-medium">{outcomeLine(row)}</span>
                <span className="block text-[11px] text-muted-foreground">
                  #{row.rally_number} · {serveLine(row)}
                </span>
              </>
            )

            return (
              <li
                key={row.id}
                id={`rally-${row.id}`}
                className={cn(
                  "scroll-mt-16 rounded-md",
                  highlightId === row.id && "ring-2 ring-primary/50"
                )}
              >
                <RowShell
                  editable={editable}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {isLet ? (
                    <span className="col-span-3 flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex-1 border-t border-dashed"
                      />
                      <span className="shrink-0 text-center text-[11px] text-muted-foreground">
                        #{row.rally_number} · Let (replayed)
                        <span className="block">{serveLine(row)}</span>
                      </span>
                      <span
                        aria-hidden
                        className="flex-1 border-t border-dashed"
                      />
                    </span>
                  ) : (
                    <>
                      <span className="text-right">{p1Won && cell}</span>
                      <span className="self-center text-center text-xs font-semibold text-muted-foreground tabular-nums">
                        {score.p1}–{score.p2}
                      </span>
                      <span>{!p1Won && cell}</span>
                    </>
                  )}
                </RowShell>
              </li>
            )
          })}
      </ol>
    </div>
  )
}

function RowShell({
  editable,
  onClick,
  children,
}: {
  editable: boolean
  onClick?: () => void
  children: ReactNode
}) {
  const layout =
    "grid w-full grid-cols-[1fr_3.5rem_1fr] items-center gap-2 rounded-md px-2 py-1.5 text-sm"
  if (!editable || !onClick) {
    return <div className={layout}>{children}</div>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Tap to edit this rally"
      className={cn(
        layout,
        "cursor-pointer transition-colors hover:bg-muted/60"
      )}
    >
      {children}
    </button>
  )
}
