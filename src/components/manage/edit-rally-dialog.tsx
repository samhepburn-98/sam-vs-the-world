import { useState } from "react"

import { RallyEditor } from "@/components/logger/rally-editor"
import { EditDialog } from "@/components/manage/edit-dialog"
import { friendlyWriteError } from "@/lib/queries/friendly-errors"
import { useInsertRallyAt } from "@/lib/queries/insert-rally-at"
import { useUpdateRally } from "@/lib/queries/update-rally"
import { usePlayers } from "@/lib/queries/get-players"

import type { DraftContext, RallyRow } from "@/lib/logger/rally-draft"
import type { RallyDbRowWithGame } from "@/lib/schemas/rally"

// Rally editing on /manage reuses the logger's RallyEditor — the saved row
// reopens in the same state machine, so every entry auto-rule applies here
// too. Insert mode targets a position: insert_rally_at renumbers the later
// rallies in one transaction (§5.4).

interface EditRallyDialogProps {
  rally: RallyDbRowWithGame
  /** "edit" changes the row in place; "insert" adds a new rally before it */
  mode: "edit" | "insert"
  onClose: () => void
}

export function EditRallyDialog({ rally, mode, onClose }: EditRallyDialogProps) {
  const players = usePlayers()
  const update = useUpdateRally()
  const insertAt = useInsertRallyAt()
  const mutation = mode === "edit" ? update : insertAt

  const match = rally.games.matches
  const ctx: DraftContext = {
    player1Id: match.player1_id,
    player2Id: match.player2_id,
    rules: {
      targetScore: match.target_score,
      tiebreak: match.tiebreak,
      servesPerPoint: match.serves_per_point === 1 ? 1 : 2,
      letResetsServe: match.let_resets_serve,
    },
  }
  const nameOf = (id: string) =>
    players.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  // insert mode starts from a synthetic let at the target position — the
  // most common missed rally — with the row's serve context as the guess.
  // useState pins the client id for the dialog's lifetime (idempotent retry).
  const [row] = useState<RallyRow>(() =>
    mode === "edit"
      ? { ...rally, serve_number: rally.serve_number === 2 ? 2 : 1 }
      : {
          id: crypto.randomUUID(),
          game_id: rally.game_id,
          rally_number: rally.rally_number,
          server_id: rally.server_id,
          serve_side: rally.serve_side,
          serve_number: 1,
          winner_id: null,
          end_reason: "let",
          error_detail: null,
          forced: null,
          shot_type: null,
          shot_count: null,
        },
  )

  const gameLabel = `G${rally.games.game_number} · ${nameOf(match.player1_id)} vs ${nameOf(match.player2_id)}`

  return (
    <EditDialog
      open
      title={
        mode === "edit"
          ? `Edit rally #${rally.rally_number}`
          : `Insert rally at #${rally.rally_number}`
      }
      description={
        mode === "edit"
          ? `${gameLabel} — the derived score recomputes everywhere.`
          : `${gameLabel} — rallies from #${rally.rally_number} shift up by one, in one transaction.`
      }
      onClose={onClose}
    >
      <div className="flex flex-col gap-3">
        <RallyEditor
          row={row}
          title={mode === "edit" ? undefined : "The missed rally"}
          ctx={ctx}
          p1Name={nameOf(match.player1_id)}
          p2Name={nameOf(match.player2_id)}
          onSave={(saved) => {
            mutation.mutate(saved, { onSuccess: onClose })
          }}
          onCancel={onClose}
        />
        {mutation.isError && (
          <p role="alert" className="text-destructive text-sm">
            {friendlyWriteError(mutation.error)}
          </p>
        )}
      </div>
    </EditDialog>
  )
}
