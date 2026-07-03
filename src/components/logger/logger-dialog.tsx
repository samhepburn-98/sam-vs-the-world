import { Button } from "@/components/ui/button"

// Shared overlay for the logger's dialogs (hotkeys, glossary). Backdrop click
// closes; Escape is handled by the shell's key dispatch, which also swallows
// logging keys while any dialog is open.

interface LoggerDialogProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function LoggerDialog({
  open,
  title,
  onClose,
  children,
}: LoggerDialogProps) {
  if (!open) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-2xl rounded-lg border p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-heading flex-1 text-lg font-bold">{title}</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
