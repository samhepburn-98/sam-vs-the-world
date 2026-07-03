import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Shared shell for the logger's dialogs (hotkeys, glossary) — a thin wrapper
// over the shadcn/Radix dialog: portal, focus trap + restore, scroll lock,
// backdrop and Escape close. The logging-shell separately swallows hotkeys
// while a dialog is open.

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
  return (
    <Dialog
      open={open}
      onOpenChange={(nowOpen) => {
        if (!nowOpen) onClose()
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
