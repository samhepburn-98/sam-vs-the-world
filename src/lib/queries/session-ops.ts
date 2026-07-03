import { insertGameOp } from "@/lib/queries/create-game"
import { insertRallyOp } from "@/lib/queries/create-rally"
import { deleteGameOp } from "@/lib/queries/delete-game"
import { deleteRallyOp } from "@/lib/queries/delete-rally"
import { updateRallyOp } from "@/lib/queries/update-rally"

import type { WriteIntent } from "@/lib/logger/session"
import type { WriteOp } from "@/lib/queue/write-queue"

/** Maps the session planner's pure write intents onto real queue ops. */
export function intentToOp(intent: WriteIntent): WriteOp {
  switch (intent.kind) {
    case "insert_rally":
      return insertRallyOp(intent.row)
    case "update_rally":
      return updateRallyOp(intent.row)
    case "delete_rally":
      return deleteRallyOp(intent.row)
    case "insert_game":
      return insertGameOp(intent.game)
    case "delete_game":
      return deleteGameOp(intent.game)
  }
}
