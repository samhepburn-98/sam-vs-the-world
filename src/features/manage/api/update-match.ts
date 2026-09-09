import { useMutation, useQueryClient } from "@tanstack/react-query"

import { matchEditSchema } from "@/lib/schemas/match"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { MatchEditInput } from "@/lib/schemas/match"
import type { MutationConfig } from "@/lib/react-query"

export async function updateMatch({
  id,
  ...raw
}: MatchEditInput & { id: string }) {
  const input = matchEditSchema.parse(raw)
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase
    .from("matches")
    .update({
      date: input.date,
      player1_id: input.player1Id,
      player2_id: input.player2Id,
      venue: input.venue?.length ? input.venue : null,
      notes: input.notes?.length ? input.notes : null,
      format: input.houseRules.format,
      target_score: input.houseRules.targetScore,
      tiebreak: input.houseRules.tiebreak,
      serves_per_point: input.houseRules.servesPerPoint,
      let_resets_serve: input.houseRules.letResetsServe,
      ball_type: input.houseRules.ballType,
    })
    .eq("id", id)
  if (error) throw error
}

type UseUpdateMatchOptions = {
  mutationConfig?: MutationConfig<typeof updateMatch>
}

export function useUpdateMatch({ mutationConfig }: UseUpdateMatchOptions = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...restConfig } = mutationConfig ?? {}
  return useMutation({
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["matches"] })
      // the insight RPCs filter on date and ball type, and format moves the
      // clinch threshold — all editable here
      void queryClient.invalidateQueries({ queryKey: ["insights"] })
      onSuccess?.(...args)
    },
    ...restConfig,
    mutationFn: updateMatch,
  })
}
