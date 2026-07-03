import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { GameRef } from "@/lib/rally/write-intent"
import type { WriteOp } from "@/lib/api/write-queue"

interface DeleteCapableClient {
  from: (table: "games") => {
    delete: () => {
      eq: (column: "id", value: string) => PromiseLike<{ error: unknown }>
    }
  }
}

/** Undo's game delete as a queue op. The session planner only ever deletes a
 *  game it knows to be empty; the FK cascade makes the delete atomic either
 *  way, so a game row can never be orphaned mid-undo. */
export function deleteGameOp(
  game: GameRef,
  // tsc trips TS2589 (excessively deep) checking the real delete-builder type
  // against this slice; eslint's checker resolves it and calls the cast
  // unnecessary — narrow through unknown and keep both satisfied
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  client: DeleteCapableClient = getSupabaseBrowserClient() as unknown as DeleteCapableClient,
): WriteOp {
  return {
    id: game.id,
    label: `undo game ${game.gameNumber}`,
    run: async () => {
      const { error } = await client
        .from("games")
        .delete()
        .eq("id", game.id)
      if (error) throw error
    },
  }
}

/** The same delete as a manage mutation (§5.4) — cascades to the game's
 *  rallies per the schema FKs. */
export function useDeleteGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (game: GameRef) => deleteGameOp(game).run(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
    },
  })
}
