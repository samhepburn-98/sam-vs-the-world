import { LoggerDialog } from "@/features/logger/components/logger-dialog"
import { Overline } from "@/components/typography"
import { Kbd, KbdHintsContext } from "@/components/ui/kbd"
import { Toggle } from "@/components/ui/toggle"
import { HOTKEY_HINTS } from "@/features/logger/lib/hotkeys"

// The `?` cheat-sheet overlay (§5.3). Rows are built from HOTKEY_HINTS — the
// same object the resolver and control hints use, so it can't drift.

const GROUPS: Array<{ title: string; rows: Array<[string, string]> }> = [
  {
    title: "Rally",
    rows: [
      [HOTKEY_HINTS.winnerP1, "Left player won"],
      [HOTKEY_HINTS.winnerP2, "Right player won"],
      [HOTKEY_HINTS.let, "Let (saves immediately)"],
      [HOTKEY_HINTS.save, "Save rally"],
      [`${HOTKEY_HINTS.undo} / ⌘z`, "Undo"],
    ],
  },
  {
    title: "How it ended",
    rows: [
      [HOTKEY_HINTS.endReason.winner, "Winner (they didn't touch it)"],
      [HOTKEY_HINTS.endReason.error, "Error (hit it, no return)"],
      [HOTKEY_HINTS.endReason.stroke, "Stroke"],
      [HOTKEY_HINTS.endReason.serve_fault, "Serve fault"],
    ],
  },
  {
    title: "Error detail",
    rows: [
      [HOTKEY_HINTS.errorDetail.tin, "Tin"],
      [HOTKEY_HINTS.errorDetail.out_top, "Out top"],
      [HOTKEY_HINTS.errorDetail.out_side, "Out side"],
      [HOTKEY_HINTS.errorDetail.out_back, "Out back"],
      [HOTKEY_HINTS.errorDetail.not_up, "Not up"],
    ],
  },
  {
    title: "Adjust",
    rows: [
      [HOTKEY_HINTS.forced, "Forced / unforced"],
      [HOTKEY_HINTS.serveNumber, "1st / 2nd serve"],
      [HOTKEY_HINTS.serveSide, "Serve box"],
      ["0–9", "Shot count"],
      [HOTKEY_HINTS.help, "This cheat sheet"],
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
  return (
    <LoggerDialog open={open} title="Hotkeys" onClose={onClose}>
      {/* the sheet's own keys are content, not hints — always visible */}
      <KbdHintsContext.Provider value={true}>
        <div className="grid gap-6 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <Overline className="mb-2">{group.title}</Overline>
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
        <footer className="mt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Keys are inert while a text field is focused. Buttons always work —
            hotkeys are the fast path, not the only path.
          </p>
          <Toggle
            variant="outline"
            size="sm"
            className="shrink-0"
            pressed={hintsVisible}
            onPressedChange={onToggleHints}
          >
            {hintsVisible ? "Key hints shown" : "Key hints hidden"}
          </Toggle>
        </footer>
      </KbdHintsContext.Provider>
    </LoggerDialog>
  )
}
