import { END_REASON_HELP, ERROR_DETAIL_HELP } from "@/features/logger/components/glossary"
import { Button } from "@/components/ui/button"
import { NumberStepper } from "@/components/ui/number-stepper"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Kbd } from "@/components/ui/kbd"
import { HOTKEY_HINTS } from "@/features/logger/logic/hotkeys"
import {
  canSave,
  showsErrorDetail,
  showsForced,
  showsServeFault,
  showsShotType,
} from "@/lib/rally/rally-draft"
import { Constants } from "@/lib/database.types"
import { LOGGABLE_ERROR_DETAILS } from "@/lib/schemas/enums"
import { cn } from "@/lib/utils"

import type { RallyDraft } from "@/lib/rally/rally-draft"
import type { EndReason, ErrorDetail, ShotType } from "@/lib/schemas/enums"

// The secondary chips (§5.3): appear after the winner tap; only the fields
// valid for the chosen end reason exist — the state machine clears the rest.

const END_REASON_LABELS: Record<EndReason, string> = {
  winner: "Winner",
  error: "Error",
  stroke: "Stroke",
  let: "Let",
  ace: "Ace",
  serve_fault: "Serve fault",
}

// The one-line rule under each primary outcome (§2), so the winner/error call
// is settled at a glance by the one thing on the clip: did the opponent get a
// racket on the ball?
const OUTCOME_RULE: Record<"winner" | "error", string> = {
  winner: "they didn't touch it",
  error: "they hit it, no return",
}

/** The one selectable chip used for every choice in this form — outcomes,
 *  error detail, forced — so they all read as one family (selected = primary).
 *  `rule` present → a prominent two-line chip (winner / error); absent → a
 *  compact one. */
function Chip({
  label,
  hint,
  rule,
  title,
  selected,
  onSelect,
}: {
  label: string
  hint?: string
  rule?: string
  title?: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      type="button"
      size={rule ? "default" : "sm"}
      variant={selected ? "default" : "outline"}
      aria-pressed={selected}
      title={title}
      onClick={onSelect}
      className={cn(rule && "h-auto flex-col items-start gap-0.5 py-2")}
    >
      <span className="flex items-center gap-1.5 font-medium">
        {hint && <Kbd>{hint}</Kbd>}
        {label}
      </span>
      {rule && (
        <span
          className={cn(
            "text-xs font-normal",
            selected ? "text-primary-foreground/85" : "text-muted-foreground",
          )}
        >
          {rule}
        </span>
      )}
    </Button>
  )
}

const ERROR_DETAIL_LABELS: Record<ErrorDetail, string> = {
  tin: "Tin",
  out_top: "Out top",
  out_side: "Out side",
  out_back: "Out back",
  not_up: "Not up",
  double_bounce: "Dbl bounce",
}

interface OutcomeChipsProps {
  draft: RallyDraft
  winnerName: string
  onEndReason: (reason: EndReason) => void
  onErrorDetail: (detail: ErrorDetail | null) => void
  onForced: (forced: boolean | null) => void
  onShotType: (shotType: ShotType | null) => void
  onShotCount: (count: number | null) => void
  onSave: () => void
  onCancel: () => void
  onOpenGlossary: () => void
}

export function OutcomeChips({
  draft,
  winnerName,
  onEndReason,
  onErrorDetail,
  onForced,
  onShotType,
  onShotCount,
  onSave,
  onCancel,
  onOpenGlossary,
}: OutcomeChipsProps) {
  return (
    <section
      aria-label="How the rally ended"
      className="bg-card flex flex-col gap-3 rounded-lg border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm">
          Point to <span className="font-bold">{winnerName}</span>
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="What do these mean?"
          className="text-muted-foreground size-7 rounded-full p-0"
          onClick={onOpenGlossary}
        >
          ?
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">How did the rally end?</p>
        {/* the everyday call sits up front as two clear buttons; the rare
            situational reasons stay small underneath */}
        <div className="grid grid-cols-2 gap-2">
          <Chip
            label={END_REASON_LABELS.winner}
            hint={HOTKEY_HINTS.endReason.winner}
            rule={OUTCOME_RULE.winner}
            title={END_REASON_HELP.winner}
            selected={draft.endReason === "winner"}
            onSelect={() => onEndReason("winner")}
          />
          <Chip
            label={END_REASON_LABELS.error}
            hint={HOTKEY_HINTS.endReason.error}
            rule={OUTCOME_RULE.error}
            title={END_REASON_HELP.error}
            selected={draft.endReason === "error"}
            onSelect={() => onEndReason("error")}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip
            label={END_REASON_LABELS.stroke}
            hint={HOTKEY_HINTS.endReason.stroke}
            title={END_REASON_HELP.stroke}
            selected={draft.endReason === "stroke"}
            onSelect={() => onEndReason("stroke")}
          />
          {showsServeFault(draft) && (
            <Chip
              label={END_REASON_LABELS.serve_fault}
              hint={HOTKEY_HINTS.endReason.serve_fault}
              title={END_REASON_HELP.serve_fault}
              selected={draft.endReason === "serve_fault"}
              onSelect={() => onEndReason("serve_fault")}
            />
          )}
        </div>
      </div>

      {showsErrorDetail(draft.endReason) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">
            Detail
          </span>
          {LOGGABLE_ERROR_DETAILS.map((d) => (
            <Chip
              key={d}
              label={ERROR_DETAIL_LABELS[d]}
              hint={HOTKEY_HINTS.errorDetail[d]}
              title={ERROR_DETAIL_HELP[d]}
              selected={draft.errorDetail === d}
              onSelect={() =>
                onErrorDetail(draft.errorDetail === d ? null : d)
              }
            />
          ))}
        </div>
      )}

      {showsForced(draft.endReason) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">
            Forced?
          </span>
          <Chip
            label="Unforced"
            selected={draft.forced === false}
            onSelect={() => onForced(draft.forced === false ? null : false)}
          />
          <Chip
            label="Forced"
            hint={HOTKEY_HINTS.forced}
            selected={draft.forced === true}
            onSelect={() => onForced(draft.forced === true ? null : true)}
          />
        </div>
      )}

      {showsShotType(draft.endReason) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">
            Shot
          </span>
          <Select
            value={draft.shotType ?? "none"}
            onValueChange={(v) => onShotType(v === "none" ? null : (v as ShotType))}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="none">—</SelectItem>
                {Constants.public.Enums.shot_type.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-12 shrink-0 text-xs">
          Shots
        </span>
        <NumberStepper
          value={draft.shotCount}
          onChange={onShotCount}
          min={1}
          ariaLabel="shot count"
        />
        <span className="text-muted-foreground text-xs">
          every racket touch counts, including the last
        </span>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canSave(draft)}
          onClick={onSave}
        >
          <Kbd className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
            {HOTKEY_HINTS.save}
          </Kbd>
          Save
        </Button>
      </div>
    </section>
  )
}
