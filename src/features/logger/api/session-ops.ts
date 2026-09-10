import { insertGameOp } from "@/lib/api/create-game"
import { insertRallyOp } from "@/lib/api/create-rally"
import { deleteGameOp } from "@/lib/api/delete-game"
import { deleteRallyOp } from "@/lib/api/delete-rally"
import { updateRallyOp } from "@/lib/api/update-rally"

import type { WriteIntent } from "@/lib/rally/write-intent"
import type { WriteOp } from "@/lib/api/write-queue"

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
