import { Button } from "@/components/ui/button"
import { Kbd, KbdHintsContext } from "@/components/ui/kbd"
import { Toggle } from "@/components/ui/toggle"
import { HOTKEY_HINTS } from "@/lib/logger/hotkeys"

// The `?` cheat-sheet overlay (§5.3). Rows are built from HOTKEY_HINTS — the
// same object the resolver and control hints use, so it can't drift.

const GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: "Rally",
    rows: [
      [HOTKEY_HINTS.winnerP1, "left player won"],
      [HOTKEY_HINTS.winnerP2, "right player won"],
      [HOTKEY_HINTS.let, "let (saves immediately)"],
      [HOTKEY_HINTS.save, "save rally"],
      [`${HOTKEY_HINTS.undo} / ⌘z`, "undo"],
    ],
  },
  {
    title: "How it ended",
    rows: [
      [HOTKEY_HINTS.endReason.winner, "winner"],
      [HOTKEY_HINTS.endReason.error, "error"],
      [HOTKEY_HINTS.endReason.stroke, "stroke"],
      [HOTKEY_HINTS.endReason.ace, "ace"],
      [HOTKEY_HINTS.endReason.serve_fault, "serve fault"],
    ],
  },
  {
    title: "Error detail",
    rows: [
      [HOTKEY_HINTS.errorDetail.tin, "tin"],
      [HOTKEY_HINTS.errorDetail.out_top, "out top"],
      [HOTKEY_HINTS.errorDetail.out_side, "out side"],
      [HOTKEY_HINTS.errorDetail.out_back, "out back"],
      [HOTKEY_HINTS.errorDetail.not_up, "not up"],
      [HOTKEY_HINTS.errorDetail.double_bounce, "double bounce"],
    ],
  },
  {
    title: "Adjust",
    rows: [
      [HOTKEY_HINTS.forced, "forced / unforced"],
      [HOTKEY_HINTS.serveNumber, "1st / 2nd serve"],
      [HOTKEY_HINTS.serveSide, "serve box"],
      ["0–9", "shot count"],
      [HOTKEY_HINTS.help, "this cheat sheet"],
    ],
  },
]

interface HotkeyHelpProps {
  open: boolean
  onClose: () => void
  /** whether key hints render on the logger's controls */
  hintsVisible: boolean
  onToggleHints: (visible: boolean) => void
}

export function HotkeyHelp({
  open,
  onClose,
  hintsVisible,
  onToggleHints,
}: HotkeyHelpProps) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hotkeys"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* the sheet's own keys are content, not hints — always visible */}
      <KbdHintsContext.Provider value={true}>
      <div
        className="bg-card w-full max-w-2xl rounded-lg border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-heading flex-1 text-lg font-bold">Hotkeys</h2>
          <Toggle
            variant="outline"
            size="sm"
            pressed={hintsVisible}
            onPressedChange={onToggleHints}
          >
            {hintsVisible ? "Key hints shown" : "Key hints hidden"}
          </Toggle>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="text-muted-foreground mb-2 text-xs tracking-widest uppercase">
                {group.title}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {group.rows.map(([keys, label]) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <Kbd className="h-5 min-w-5 text-[11px]">{keys}</Kbd>
                    {label}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="text-muted-foreground mt-4 text-xs">
          Keys are inert while a text field is focused. Buttons always work —
          hotkeys are the fast path, not the only path.
        </p>
      </div>
      </KbdHintsContext.Provider>
    </div>
  )
}
