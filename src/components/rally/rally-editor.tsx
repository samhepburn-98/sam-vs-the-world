import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Constants } from "@/lib/database.types"
import { LOGGABLE_ERROR_DETAILS, LOGGABLE_SHOT_TYPES } from "@/lib/schemas/enums"
import {
  buildRallyRow,
  canSave,
  rowToDraft,
  selectEndReason,
  setForced,
  showsErrorDetail,
  showsForced,
  showsServeFault,
  showsShotType,
  tapWinner,
  toggleServeNumber,
  toggleServeSide,
  toggleServer,
} from "@/lib/rally/rally-draft"

import type { DraftContext, RallyRow } from "@/lib/rally/rally-draft"
import type { EndReason, ErrorDetail, ShotType } from "@/lib/schemas/enums"

// Inline rally editing (§5.3, §6.1): the saved row reopens as a draft in the
// same state machine that created it, so every auto-rule still applies —
// including converting a mis-logged rally to a let and back. Unlike entry,
// every field is on show: winner, server, box, serve number, outcome.

// Match the logger's framing: chosen by whether the opponent touched the ball.
const END_REASON_LABELS: Record<EndReason, string> = {
  winner: "No touch",
  error: "Hit, no return",
  stroke: "Stroke",
  let: "Let",
  ace: "Ace",
  serve_fault: "Serve fault",
}

const ERROR_DETAIL_LABELS: Record<ErrorDetail, string> = {
  tin: "Tin",
  out_top: "Out top",
  out_side: "Out side",
  out_back: "Out back",
  not_up: "Not up",
  double_bounce: "Dbl bounce",
}

interface RallyEditorProps {
  row: RallyRow
  /** defaults to "Editing rally #n" */
  title?: string
  ctx: DraftContext
  p1Name: string
  p2Name: string
  onSave: (row: RallyRow) => void
  onCancel: () => void
}

export function RallyEditor({
  row,
  title,
  ctx,
  p1Name,
  p2Name,
  onSave,
  onCancel,
}: RallyEditorProps) {
  const [draft, setDraft] = useState(() => rowToDraft(row))
  const nameOf = (id: string) => (id === ctx.player1Id ? p1Name : p2Name)

  const fieldRow = (label: string, control: React.ReactNode) => (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground w-12 shrink-0 text-xs">
        {label}
      </span>
      {control}
    </div>
  )

  return (
    <section
      aria-label={`Edit rally ${row.rally_number}`}
      className="border-primary/40 bg-card flex flex-col gap-3 rounded-lg border p-4"
    >
      <p className="text-sm font-semibold">{title ?? `Editing rally #${row.rally_number}`}</p>

      {fieldRow(
        "Winner",
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={draft.winnerId ?? ""}
          onValueChange={(v) => {
            if (v) setDraft((d) => tapWinner(d, v, ctx))
          }}
        >
          <ToggleGroupItem value={ctx.player1Id}>{p1Name}</ToggleGroupItem>
          <ToggleGroupItem value={ctx.player2Id}>{p2Name}</ToggleGroupItem>
        </ToggleGroup>,
      )}

      {fieldRow(
        "How",
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={draft.endReason ?? ""}
          onValueChange={(v) => {
            if (v) setDraft((d) => selectEndReason(d, v as EndReason, ctx))
          }}
        >
          {Constants.public.Enums.end_reason
            .filter((r) => r !== "ace")
            .filter((r) => r !== "serve_fault" || showsServeFault(draft))
            .map((r) => (
              <ToggleGroupItem key={r} value={r}>
                {END_REASON_LABELS[r]}
              </ToggleGroupItem>
            ))}
        </ToggleGroup>,
      )}

      {fieldRow(
        "Serve",
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraft((d) => toggleServer(d, ctx))}
          >
            {nameOf(draft.serverId)} served
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDraft((d) => toggleServeSide(d))}
          >
            {draft.serveSide === "left" ? "Left" : "Right"} box
          </Button>
          {ctx.rules.servesPerPoint === 2 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDraft((d) => toggleServeNumber(d, ctx))}
            >
              {draft.serveNumber === 1 ? "1st serve" : "2nd serve"}
            </Button>
          )}
        </>,
      )}

      {showsErrorDetail(draft.endReason) &&
        fieldRow(
          "Detail",
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={draft.errorDetail ?? ""}
            onValueChange={(v) =>
              setDraft((d) => ({
                ...d,
                errorDetail: v === "" ? null : (v as ErrorDetail),
              }))
            }
          >
            {LOGGABLE_ERROR_DETAILS.map((d) => (
              <ToggleGroupItem key={d} value={d}>
                {ERROR_DETAIL_LABELS[d]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>,
        )}

      {showsForced(draft.endReason) &&
        fieldRow(
          "Forced?",
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={draft.forced === null ? "" : draft.forced ? "yes" : "no"}
            onValueChange={(v) =>
              setDraft((d) => setForced(d, v === "" ? null : v === "yes"))
            }
          >
            <ToggleGroupItem value="no">Unforced</ToggleGroupItem>
            <ToggleGroupItem value="yes">Forced</ToggleGroupItem>
          </ToggleGroup>,
        )}

      <div className="flex flex-wrap items-center gap-2">
        {showsShotType(draft.endReason) && (
          <>
            <span className="text-muted-foreground w-12 shrink-0 text-xs">
              Shot
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              className="flex-wrap"
              value={draft.shotType ?? ""}
              onValueChange={(v) =>
                setDraft((d) => ({
                  ...d,
                  shotType: v === "" ? null : (v as ShotType),
                }))
              }
            >
              {LOGGABLE_SHOT_TYPES.map((s) => (
                <ToggleGroupItem key={s} value={s} className="capitalize">
                  {s}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )}
        {draft.endReason !== "let" && (
          <>
            <span className="text-muted-foreground shrink-0 text-xs">
              Shots
            </span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              className="w-20"
              value={draft.shotCount ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  shotCount:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            />
          </>
        )}
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!canSave(draft)}
            onClick={() =>
              onSave(
                buildRallyRow(draft, {
                  id: row.id,
                  gameId: row.game_id,
                  rallyNumber: row.rally_number,
                }),
              )
            }
          >
            Save changes
          </Button>
        </div>
      </div>
    </section>
  )
}
