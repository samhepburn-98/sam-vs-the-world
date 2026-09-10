import { useEffect } from "react"

import { hotkeyAction, isEditableTarget } from "@/features/logger/lib/hotkeys"

import type { HotkeyAction } from "@/features/logger/lib/hotkeys"

// The window-level key listener behind §5.3's keyboard-first logging. It is
// on the window so no control has to hold focus — you can log a whole game
// without touching the mouse — which also means this hook owns the decision
// about when the keyboard belongs to something else.
//
// Four things can claim it, in order:
//   · a text input (isEditableTarget) — never intercept typing
//   · the inline rally editor — it owns every key while open
//   · the glossary — you are reading, not logging
//   · the hotkey cheat sheet — only its own key gets through, so `?` closes it
//
// Escape is the one key handled here rather than dispatched, because it means
// "close the closest thing" and only this layer knows what is open.

export interface LoggerHotkeyState {
  /** the match is over — the summary is showing, nothing left to log */
  finished: boolean
  /** the id of the rally open in the inline editor, or null */
  editingId: string | null
  helpOpen: boolean
  glossaryOpen: boolean
}

export interface LoggerHotkeyHandlers {
  /** run the action a key maps to */
  dispatch: (action: HotkeyAction) => void
  closeGlossary: () => void
  closeHelp: () => void
  closeEditor: () => void
}

export function useLoggerHotkeys(
  state: LoggerHotkeyState,
  handlers: LoggerHotkeyHandlers
): void {
  const { finished, editingId, helpOpen, glossaryOpen } = state
  const { dispatch, closeGlossary, closeHelp, closeEditor } = handlers

  // no dependency array on purpose: re-bound every render so the closure
  // always sees fresh state. The listener is cheap and the alternative is a
  // ref-chasing dance that has to be right on every field above.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (finished || isEditableTarget(e.target)) return
      if (e.key === "Escape") {
        if (glossaryOpen) closeGlossary()
        else if (helpOpen) closeHelp()
        else if (editingId !== null) closeEditor()
        return
      }
      if (editingId !== null) return // inline editor owns the keyboard
      const action = hotkeyAction(e)
      if (!action) return
      if (glossaryOpen) return // reading, not logging
      if (helpOpen && action.type !== "help") return
      e.preventDefault()
      dispatch(action)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })
}
