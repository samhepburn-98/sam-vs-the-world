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
              <ToggleGroupItem key={r} value={r}>
                <Kbd>{HOTKEY_HINTS.endReason[r]}</Kbd>
                {END_REASON_LABELS[r]}
              </ToggleGroupItem>
            ),
          )}
        </ToggleGroup>
      </div>

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
              <ToggleGroupItem key={d} value={d}>
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

      <div className="flex flex-wrap items-center gap-2">
        {showsShotType(draft.endReason) && (
          <>
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
          </>
        )}
        <span className="text-muted-foreground shrink-0 text-xs">shots</span>
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
        <div className="ml-auto flex gap-2">
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
            Save — {winnerName}
          </Button>
        </div>
      </div>
    </section>
  )
}
