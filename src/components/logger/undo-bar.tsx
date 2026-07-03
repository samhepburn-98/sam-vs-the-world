import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { HOTKEY_HINTS } from "@/lib/logger/hotkeys"

// One-action undo with a redo grace (§5.3): visible only while there is
// something to reverse; any new save or edit clears both.

interface UndoBarProps {
  undoLabel: string | null
  redoLabel: string | null
  onUndo: () => void
  onRedo: () => void
}

export function UndoBar({ undoLabel, redoLabel, onUndo, onRedo }: UndoBarProps) {
  if (!undoLabel && !redoLabel) return null
  return (
    <div className="flex justify-end gap-2">
      {undoLabel && (
        <Button type="button" variant="outline" size="sm" onClick={onUndo}>
          <Kbd>{HOTKEY_HINTS.undo}</Kbd>
          {undoLabel}
        </Button>
      )}
      {redoLabel && (
        <Button type="button" variant="ghost" size="sm" onClick={onRedo}>
          {redoLabel}
        </Button>
      )}
    </div>
  )
}
