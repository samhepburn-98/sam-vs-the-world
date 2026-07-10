import { END_REASON_HELP, ERROR_DETAIL_HELP } from "@/features/logger/components/glossary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Kbd } from "@/components/ui/kbd"
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

import type { RallyDraft } from "@/lib/rally/rally-draft"
import type { EndReason, ErrorDetail, ShotType } from "@/lib/schemas/enums"

// The secondary chips (§5.3): appear after the winner tap; only the fields
// valid for the chosen end reason exist — the state machine clears the rest.

// Logging labels are framed by the one thing you can see on the clip: did the
// opponent get a racket on the ball? (§2). "No touch" stores a winner, "Hit,
// no return" an error — the analytics still call them winners and errors.
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-12 shrink-0 text-xs">How</span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          className="flex-wrap"
          value={draft.endReason ?? ""}
          onValueChange={(v) => v && onEndReason(v as EndReason)}
        >
          {(["winner", "error", "stroke"] as const).map((r) => (
            <ToggleGroupItem key={r} value={r} title={END_REASON_HELP[r]}>
              <Kbd>{HOTKEY_HINTS.endReason[r]}</Kbd>
              {END_REASON_LABELS[r]}
            </ToggleGroupItem>
          ))}
          {showsServeFault(draft) && (
            <ToggleGroupItem
              value="serve_fault"
              title={END_REASON_HELP.serve_fault}
            >
              <Kbd>{HOTKEY_HINTS.endReason.serve_fault}</Kbd>
              {END_REASON_LABELS.serve_fault}
            </ToggleGroupItem>
          )}
        </ToggleGroup>
      </div>

      {showsErrorDetail(draft.endReason) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">
            Detail
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
            Forced?
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
              Forced
            </ToggleGroupItem>
          </ToggleGroup>
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
                {LOGGABLE_SHOT_TYPES.map((s) => (
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
        <Input
          type="number"
          min={0}
          inputMode="numeric"
          className="w-20"
          value={draft.shotCount ?? ""}
          onChange={(e) =>
            onShotCount(e.target.value === "" ? null : Number(e.target.value))
          }
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
