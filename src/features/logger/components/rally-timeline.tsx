import { cn } from "@/lib/utils"

import type { RallyRow } from "@/lib/rally/rally-draft"
import type { ReactNode } from "react"

// The shared rally timeline (§5.3, §5.2): two-sided — each rally sits on its
// winner's side with the running score in the spine; lets are neutral
// hash-marks that visibly don't advance it. Newest at top. The same component
// serves the logger (editable: click a row to edit) and match detail
// (read-only). Scores are derived from the rows on every render — an edited
// row recomputes everything downstream, exactly like the DB views.

/** The rally's outcome at two altitudes: `head` is the scannable phrase
 *  ("Unforced error"), `detail` the muted texture behind it ("tin · 2
 *  shots") — so the row renders a real hierarchy, not a column dump. */
export function outcomeParts(row: RallyRow): {
  head: string
  detail: string | null
} {
  const errorDetail = row.error_detail?.replace("_", " ")
  const shots =
    row.shot_count === null
      ? null
      : `${row.shot_count} shot${row.shot_count === 1 ? "" : "s"}`
  const join = (...parts: Array<string | null | undefined>) => {
    const joined = parts.filter(Boolean).join(" · ")
    return joined === "" ? null : joined
  }
  switch (row.end_reason) {
    case "winner":
    case "ace":
      return {
        head: row.end_reason === "ace" ? "Ace" : "Winner",
        detail: join(row.shot_type, shots),
      }
    case "error":
      return {
        head:
          row.forced === null
            ? "Error"
            : row.forced
              ? "Forced error"
              : "Unforced error",
        detail: join(errorDetail, shots),
      }
    case "stroke":
      return { head: "Stroke", detail: join(shots) }
    case "serve_fault":
      return {
        head: row.serve_number === 2 ? "Double fault" : "Serve fault",
        detail: join(errorDetail),
      }
    case "let":
      return { head: "Let", detail: null }
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

  // the receipts line: just enough to find the rally in the footage. The
  // server isn't named — the dot beside the score carries that — and a 1st
  // serve goes unsaid; only the deviation ("2nd serve") is information.
  const receiptLine = (row: RallyRow) => {
    const parts = [`#${row.rally_number}`, `${row.serve_side} box`]
    if (servesPerPoint === 2 && row.serve_number === 2) parts.push("2nd serve")
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
            const servedByP1 = row.server_id === p1Id
            const { head, detail } = outcomeParts(row)
            const cell = (
              <>
                <span>
                  <span className="font-medium">{head}</span>
                  {detail && (
                    <span className="text-muted-foreground"> · {detail}</span>
                  )}
                </span>
                <span className="block text-[11px] text-muted-foreground/80">
                  {receiptLine(row)}
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
                        Let (replayed)
                        <span className="block text-muted-foreground/80">
                          {receiptLine(row)}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className="flex-1 border-t border-dashed"
                      />
                    </span>
                  ) : (
                    <>
                      <span className="text-right">{p1Won && cell}</span>
                      {/* the serve dot sits on the server's side of the score —
                          position carries it, so no colour to decode and no
                          name repeated on every row. The invisible twin keeps
                          the score perfectly centred. */}
                      <span className="self-center text-center text-xs font-semibold text-muted-foreground tabular-nums">
                        <span
                          aria-hidden
                          className={cn(
                            "mr-1 inline-block size-1 rounded-full bg-muted-foreground/70 align-middle",
                            !servedByP1 && "invisible"
                          )}
                        />
                        {score.p1}–{score.p2}
                        <span
                          aria-hidden
                          className={cn(
                            "ml-1 inline-block size-1 rounded-full bg-muted-foreground/70 align-middle",
                            servedByP1 && "invisible"
                          )}
                        />
                        <span className="sr-only">
                          {servedByP1 ? p1Name : p2Name} served
                        </span>
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
