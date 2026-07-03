import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Shared shell for the manage edit forms (§5.4): a centred dialog. A failed
// save keeps it open with the friendly error — the row is visibly dirty,
// never silently reverted.

interface EditDialogProps {
  open: boolean
  title: string
  description: string
  onClose: () => void
  children: React.ReactNode
}

export function EditDialog({
  open,
  title,
  description,
  onClose,
  children,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
