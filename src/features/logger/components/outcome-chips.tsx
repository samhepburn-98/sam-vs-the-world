import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"

import { ERROR_DETAIL_HELP } from "@/features/logger/components/glossary"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { NumberStepper } from "@/components/ui/number-stepper"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { HOTKEY_HINTS } from "@/features/logger/logic/hotkeys"
import {
  canSave,
  showsErrorDetail,
  showsForced,
  showsServeFault,
  showsShotType,
} from "@/lib/rally/rally-draft"
import { LOGGABLE_ERROR_DETAILS, LOGGABLE_SHOT_TYPES } from "@/lib/schemas/enums"
import { cn } from "@/lib/utils"

import type { RallyDraft } from "@/lib/rally/rally-draft"
import type { EndReason, ErrorDetail, ShotType } from "@/lib/schemas/enums"

// The outcome form: appears after the winner tap, and every option names a
// player — no label ever refers to an unnamed "opponent", so nothing needs
// translating at review speed. The two common outcomes (winner, error) are
// prominent cards settled by the one thing visible on the clip — did the
// other player get a racket on it? — while the rare calls (stroke, serve
// fault) sit demoted below them.
//
// The outcome is the only required decision, so Save sits directly under it;
// every refinement (where, why, shot, shots) lives in one quieter detail
// zone below, collapsible for score-only sessions — the preference sticks
// across rallies. Only the fields valid for the chosen end reason exist; the
// draft state machine clears the rest.

const DETAIL_PREF_KEY = "svw:log-detail"

const SHOT_TYPE_LABELS: Record<(typeof LOGGABLE_SHOT_TYPES)[number], string> = {
  drive: "Drive",
  boast: "Boast",
  drop: "Drop",
}

const ERROR_DETAIL_LABELS: Record<ErrorDetail, string> = {
  tin: "Tin",
  out_top: "Out top",
  out_side: "Out side",
  out_back: "Out back",
  not_up: "Not up",
  double_bounce: "Dbl bounce",
}

/** One of the two prominent outcome cards: a named headline plus the one-line
 *  rule that settles the call at a glance. */
function OutcomeCard({
  hint,
  headline,
  rule,
  selected,
  onSelect,
}: {
  hint: string
  headline: string
  rule: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      aria-pressed={selected}
      onClick={onSelect}
      className="h-auto flex-1 flex-col items-start gap-0.5 py-2"
    >
      <span className="flex items-center gap-1.5 font-medium">
        <Kbd>{hint}</Kbd>
        {headline}
      </span>
      <span
        className={cn(
          "text-xs font-normal",
          selected ? "text-primary-foreground/85" : "text-muted-foreground",
        )}
      >
        {rule}
      </span>
    </Button>
  )
}

/** A demoted outcome for the rare calls — quiet text until selected. */
function RareOutcome({
  hint,
  label,
  selected,
  onSelect,
}: {
  hint: string
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "ghost"}
      size="sm"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn("h-7 px-2", !selected && "text-muted-foreground")}
    >
      <Kbd>{hint}</Kbd>
      {label}
    </Button>
  )
}

interface OutcomeChipsProps {
  draft: RallyDraft
  winnerName: string
  loserName: string
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
  loserName,
  onEndReason,
  onErrorDetail,
  onForced,
  onShotType,
  onShotCount,
  onSave,
  onCancel,
  onOpenGlossary,
}: OutcomeChipsProps) {
  const [showDetail, setShowDetail] = useState(
    () => window.localStorage.getItem(DETAIL_PREF_KEY) !== "0",
  )
  const toggleDetail = () => {
    const next = !showDetail
    setShowDetail(next)
    window.localStorage.setItem(DETAIL_PREF_KEY, next ? "1" : "0")
  }

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

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <OutcomeCard
            hint={HOTKEY_HINTS.endReason.winner}
            headline={`${winnerName} hit a winner`}
            rule={`${loserName} didn't touch it`}
            selected={draft.endReason === "winner"}
            onSelect={() => onEndReason("winner")}
          />
          <OutcomeCard
            hint={HOTKEY_HINTS.endReason.error}
            headline={`${loserName} made an error`}
            rule="hit it, but no return"
            selected={draft.endReason === "error"}
            onSelect={() => onEndReason("error")}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <RareOutcome
            hint={HOTKEY_HINTS.endReason.stroke}
            label={`Stroke to ${winnerName}`}
            selected={draft.endReason === "stroke"}
            onSelect={() => onEndReason("stroke")}
          />
          {showsServeFault(draft) && (
            <RareOutcome
              hint={HOTKEY_HINTS.endReason.serve_fault}
              label={`${loserName} faulted the serve`}
              selected={draft.endReason === "serve_fault"}
              onSelect={() => onEndReason("serve_fault")}
            />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <span className="text-muted-foreground flex-1 text-right text-xs">
          saves as-is — detail is optional
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={showDetail}
          onClick={toggleDetail}
          className="text-muted-foreground h-7 px-2"
        >
          {showDetail ? (
            <ChevronDownIcon aria-hidden />
          ) : (
            <ChevronRightIcon aria-hidden />
          )}
          {showDetail ? "Hide detail" : "Show detail"}
        </Button>
      </div>

      {showDetail && (
      <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-3">
      {showsErrorDetail(draft.endReason) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">
            Where
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex-wrap"
            value={draft.errorDetail ?? ""}
            onValueChange={(v) => onErrorDetail(v === "" ? null : (v as ErrorDetail))}
          >
            {LOGGABLE_ERROR_DETAILS.map((d) => (
              <ToggleGroupItem key={d} value={d} title={ERROR_DETAIL_HELP[d]}>
                <Kbd>{HOTKEY_HINTS.errorDetail[d]}</Kbd>
                {ERROR_DETAIL_LABELS[d]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {showsForced(draft.endReason) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">
            Why
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex-wrap"
            value={draft.forced === null ? "" : draft.forced ? "yes" : "no"}
            onValueChange={(v) => onForced(v === "" ? null : v === "yes")}
          >
            <ToggleGroupItem value="no">Unforced</ToggleGroupItem>
            <ToggleGroupItem value="yes">
              <Kbd>{HOTKEY_HINTS.forced}</Kbd>
              {winnerName} forced it
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {showsShotType(draft.endReason) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">
            Shot
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            className="flex-wrap"
            value={draft.shotType ?? ""}
            onValueChange={(v) => onShotType(v === "" ? null : (v as ShotType))}
          >
            {LOGGABLE_SHOT_TYPES.map((s) => (
              <ToggleGroupItem key={s} value={s}>
                {SHOT_TYPE_LABELS[s]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <span className="text-muted-foreground text-xs">
            {draft.endReason === "error"
              ? `the shot ${loserName} was playing`
              : "the winning shot"}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-12 shrink-0 text-xs">
          Shots
        </span>
        <NumberStepper
          value={draft.shotCount}
          onChange={onShotCount}
          min={0}
          max={999}
          ariaLabel="shot count"
        />
        <span className="text-muted-foreground text-xs">
          every racket touch counts, including the last
        </span>
      </div>
      </div>
      )}
    </section>
  )
}
