import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

// Shared shell for the manage edit forms (§5.4): a right-hand Sheet. A
// failed save keeps the sheet open with the friendly error — the row is
// visibly dirty, never silently reverted.

interface EditSheetProps {
  open: boolean
  title: string
  description: string
  onClose: () => void
  children: React.ReactNode
}

export function EditSheet({
  open,
  title,
  description,
  onClose,
  children,
}: EditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
