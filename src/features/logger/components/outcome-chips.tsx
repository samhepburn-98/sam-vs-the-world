import { ChevronDownIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"

import { ERROR_DETAIL_HELP } from "@/features/logger/components/glossary"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { NumberStepper } from "@/components/ui/number-stepper"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { HOTKEY_HINTS } from "@/features/logger/lib/hotkeys"
import {
  canSave,
  showsErrorDetail,
  showsForced,
  showsServeFault,
  showsShotType,
} from "@/lib/rally/rally-draft"
import {
  LOGGABLE_ERROR_DETAILS,
  LOGGABLE_SHOT_TYPES,
} from "@/lib/schemas/enums"

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
 *  rule that settles the call at a glance. A ToggleGroupItem, so the whole
 *  outcome set is one real single-choice group (radio semantics, arrow-key
 *  focus) rather than looped buttons with hand-managed pressed state. */
function OutcomeCard({
  value,
  hint,
  headline,
  rule,
}: {
  value: EndReason
  hint: string
  headline: string
  rule: string
}) {
  return (
    <ToggleGroupItem
      value={value}
      variant="outline"
      className="group/card h-auto flex-1 flex-col items-start gap-0.5 px-3 py-2 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
    >
      <span className="flex items-center gap-1.5 font-medium">
        <Kbd>{hint}</Kbd>
        {headline}
      </span>
      <span className="text-xs font-normal text-muted-foreground group-data-[state=on]/card:text-primary-foreground/85">
        {rule}
      </span>
    </ToggleGroupItem>
  )
}

/** A demoted outcome for the rare calls — quiet text until selected. */
function RareOutcome({
  value,
  hint,
  label,
}: {
  value: EndReason
  hint: string
  label: string
}) {
  return (
    <ToggleGroupItem
      value={value}
      size="sm"
      className="h-7 px-2 text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
    >
      <Kbd>{hint}</Kbd>
      {label}
    </ToggleGroupItem>
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
    () => window.localStorage.getItem(DETAIL_PREF_KEY) !== "0"
  )
  const toggleDetail = () => {
    const next = !showDetail
    setShowDetail(next)
    window.localStorage.setItem(DETAIL_PREF_KEY, next ? "1" : "0")
  }

  return (
    <section
      aria-label="How the rally ended"
      className="flex flex-col gap-3 rounded-lg border bg-card p-4"
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
          className="size-7 rounded-full p-0 text-muted-foreground"
          onClick={onOpenGlossary}
        >
          ?
        </Button>
      </div>

      <ToggleGroup
        type="single"
        aria-label="How the rally ended"
        value={draft.endReason ?? ""}
        onValueChange={(v) => v && onEndReason(v as EndReason)}
        className="flex w-full flex-col items-stretch gap-1.5"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <OutcomeCard
            value="winner"
            hint={HOTKEY_HINTS.endReason.winner}
            headline={`${winnerName} hit a winner`}
            rule={`${loserName} didn't touch it`}
          />
          <OutcomeCard
            value="error"
            hint={HOTKEY_HINTS.endReason.error}
            headline={`${loserName} made an error`}
            rule="hit it, but no return"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <RareOutcome
            value="stroke"
            hint={HOTKEY_HINTS.endReason.stroke}
            label={`Stroke to ${winnerName}`}
          />
          {showsServeFault(draft) && (
            <RareOutcome
              value="serve_fault"
              hint={HOTKEY_HINTS.endReason.serve_fault}
              label={`${loserName} faulted the serve`}
            />
          )}
        </div>
      </ToggleGroup>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!canSave(draft)}
          onClick={onSave}
        >
          <Kbd className="border-primary-foreground/30 bg-primary-foreground/20 text-primary-foreground">
            {HOTKEY_HINTS.save}
          </Kbd>
          Save
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <span className="flex-1 text-right text-xs text-muted-foreground">
          saves as-is — detail is optional
        </span>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={toggleDetail}
          className="text-muted-foreground"
        >
          {showDetail ? (
            <ChevronDownIcon aria-hidden data-icon="inline-start" />
          ) : (
            <ChevronRightIcon aria-hidden data-icon="inline-start" />
          )}
          {showDetail ? "Hide detail" : "Show detail"}
        </Button>
      </div>

      {showDetail && (
        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          {showsErrorDetail(draft.endReason) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                Where
              </span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-label="Where the error went"
                className="flex-wrap"
                value={draft.errorDetail ?? ""}
                onValueChange={(v) =>
                  onErrorDetail(v === "" ? null : (v as ErrorDetail))
                }
              >
                {LOGGABLE_ERROR_DETAILS.map((d) => (
                  <ToggleGroupItem
                    key={d}
                    value={d}
                    title={ERROR_DETAIL_HELP[d]}
                  >
                    <Kbd>{HOTKEY_HINTS.errorDetail[d]}</Kbd>
                    {ERROR_DETAIL_LABELS[d]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          {showsForced(draft.endReason) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                Why
              </span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-label="Forced or unforced"
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
              <span className="w-12 shrink-0 text-xs text-muted-foreground">
                Shot
              </span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-label="Shot type"
                className="flex-wrap"
                value={draft.shotType ?? ""}
                onValueChange={(v) =>
                  onShotType(v === "" ? null : (v as ShotType))
                }
              >
                {LOGGABLE_SHOT_TYPES.map((s) => (
                  <ToggleGroupItem key={s} value={s}>
                    {SHOT_TYPE_LABELS[s]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <span className="text-xs text-muted-foreground">
                {draft.endReason === "winner"
                  ? `${winnerName}'s winning shot`
                  : draft.forced === true
                    ? `${winnerName}'s forcing shot`
                    : `the shot ${loserName} was playing`}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-12 shrink-0 text-xs text-muted-foreground">
              Shots
            </span>
            <NumberStepper
              value={draft.shotCount}
              onChange={onShotCount}
              min={0}
              max={999}
              ariaLabel="shot count"
            />
            <span className="text-xs text-muted-foreground">
              every racket touch counts, including the last
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
