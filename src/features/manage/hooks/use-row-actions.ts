import { useState } from "react"

// Every manage tab is the same object with different columns: a table whose
// rows can be opened for edit or put up for deletion, one at a time. That
// pairing — two nullable "which row is this about" slots — was declared
// independently in each tab, so this holds it once.
//
// The row itself is the state, not a boolean plus an id: the confirm dialog
// needs the row to write its title ("Delete game 3?"), and the mutation needs
// its fields. Null means no dialog is open, which is also what the dialogs
// read to decide whether to show.

export interface RowActions<TRow> {
  /** the row open for editing, or null */
  editing: TRow | null
  /** the row awaiting delete confirmation, or null */
  deleting: TRow | null
  edit: (row: TRow) => void
  remove: (row: TRow) => void
  /** close the edit dialog */
  doneEditing: () => void
  /** close the confirm dialog — on cancel, and on a successful delete */
  doneDeleting: () => void
}

export function useRowActions<TRow>(): RowActions<TRow> {
  const [editing, setEditing] = useState<TRow | null>(null)
  const [deleting, setDeleting] = useState<TRow | null>(null)

  return {
    editing,
    deleting,
    edit: setEditing,
    remove: setDeleting,
    doneEditing: () => setEditing(null),
    doneDeleting: () => setDeleting(null),
  }
}
