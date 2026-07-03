import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

// Owner-only delete confirm (§5.4). Deletes cascade per the schema, so the
// description must say what actually goes; a failure keeps the dialog open
// with the friendly error — never a silent revert.

interface ConfirmDeleteProps {
  open: boolean
  title: string
  description: string
  pending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDelete({
  open,
  title,
  description,
  pending,
  error,
  onCancel,
  onConfirm,
}: ConfirmDeleteProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault() // stay open: close on success/error, not click
              onConfirm()
            }}
          >
            {pending && <Spinner data-icon="inline-start" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
