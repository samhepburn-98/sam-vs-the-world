import { useState } from "react"

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
import { HOTKEY_HINTS } from "@/lib/logger/hotkeys"
import {
  canSave,
  showsErrorDetail,
  showsForced,
  showsShotType,
} from "@/lib/logger/rally-draft"
import { Constants } from "@/lib/database.types"

import type { RallyDraft } from "@/lib/logger/rally-draft"
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

const ERROR_DETAIL_LABELS: Record<ErrorDetail, string> = {
  tin: "Tin",
  out_top: "Out top",
  out_side: "Out side",
  out_back: "Out back",
  not_up: "Not up",
  double_bounce: "Dbl bounce",
}

// one-line reminders (§2 definitions) — surfaced by the ? button and on hover
const END_REASON_HELP: Record<EndReason, string> = {
  winner: "clean winning shot the opponent couldn't return",
  error: "the loser hit it down or out — pick the detail below",
  stroke: "point awarded for interference; nobody hit an error",
  let: "rally replayed — no point either way",
  ace: "unreturnable serve; the server wins the point outright",
  serve_fault: "the serve itself ended the point (2nd-serve fault = double fault)",
}

const ERROR_DETAIL_HELP: Record<ErrorDetail, string> = {
  tin: "hit the tin",
  out_top: "out above the front-wall line",
  out_side: "out on a side wall",
  out_back: "out at the back",
  not_up: "reached it, but it never made the front wall",
  double_bounce: "didn't get there — second bounce (or missed it)",
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
}: OutcomeChipsProps) {
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  return (
    <section
      aria-label="How the rally ended"
      className="bg-card flex flex-col gap-3 rounded-lg border p-4"
    >
      <p className="text-sm">
        Point to <span className="font-bold">{winnerName}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground w-12 shrink-0 text-xs">how</span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={draft.endReason ?? ""}
          onValueChange={(v) => v && onEndReason(v as EndReason)}
        >
          {(["winner", "error", "stroke", "ace", "serve_fault"] as const).map(
            (r) => (
              <ToggleGroupItem key={r} value={r} title={END_REASON_HELP[r]}>
                <Kbd>{HOTKEY_HINTS.endReason[r]}</Kbd>
                {END_REASON_LABELS[r]}
              </ToggleGroupItem>
            ),
          )}
        </ToggleGroup>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="What do these mean?"
          aria-expanded={glossaryOpen}
          className="text-muted-foreground ml-auto size-7 rounded-full p-0"
          onClick={() => setGlossaryOpen((open) => !open)}
        >
          ?
        </Button>
      </div>

      {glossaryOpen && (
        <dl className="text-muted-foreground grid gap-x-6 gap-y-1 rounded-md border border-dashed p-3 text-xs sm:grid-cols-2">
          {(["winner", "error", "stroke", "ace", "serve_fault"] as const).map(
            (r) => (
              <div key={r} className="flex gap-1.5">
                <dt className="text-foreground shrink-0 font-medium">
                  {END_REASON_LABELS[r]}:
                </dt>
                <dd>{END_REASON_HELP[r]}</dd>
              </div>
            ),
          )}
          {Constants.public.Enums.error_detail.map((d) => (
            <div key={d} className="flex gap-1.5">
              <dt className="text-foreground shrink-0 font-medium">
                {ERROR_DETAIL_LABELS[d]}:
              </dt>
              <dd>{ERROR_DETAIL_HELP[d]}</dd>
            </div>
          ))}
        </dl>
      )}

      {showsErrorDetail(draft.endReason) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground w-12 shrink-0 text-xs">
            detail
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={draft.errorDetail ?? ""}
            onValueChange={(v) => onErrorDetail(v === "" ? null : (v as ErrorDetail))}
          >
            {Constants.public.Enums.error_detail.map((d) => (
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
            forced?
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
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
            shot
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
          shots
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
