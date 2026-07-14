import { cn } from "@/lib/utils"

import type { RallyRow } from "@/lib/rally/rally-draft"
import type { ReactNode } from "react"

// The shared rally timeline (§5.3, §5.2): two-sided — each rally sits on its
// winner's side with the running score in the spine; lets are neutral
// hash-marks that visibly don't advance it. Newest at top. The same component
// serves the logger (editable: click a row to edit) and match detail
// (read-only). Scores are derived from the rows on every render — an edited
// row recomputes everything downstream, exactly like the DB views.

const END_REASON_LABELS: Record<RallyRow["end_reason"], string> = {
  winner: "winner",
  error: "error",
  stroke: "stroke",
  let: "let",
  ace: "ace",
  serve_fault: "serve fault",
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

  const outcomeLine = (row: RallyRow) => {
    const parts = [END_REASON_LABELS[row.end_reason]]
    if (row.error_detail) parts.push(row.error_detail.replace("_", " "))
    if (row.forced !== null) parts.push(row.forced ? "forced" : "unforced")
    const shot = row.winning_shot ?? row.losing_shot
    if (shot) parts.push(shot)
    if (row.shot_count !== null) {
      parts.push(`${row.shot_count} shot${row.shot_count === 1 ? "" : "s"}`)
    }
    return parts.join(" · ")
  }

  return (
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
            <li key={row.id}>
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
                      #{row.rally_number} · let (replayed)
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
