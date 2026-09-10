import { useMutation, useQueryClient } from "@tanstack/react-query"

import { uploadAvatar } from "@/lib/api/upload-avatar"
import { playerEditSchema } from "@/lib/schemas/player"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

import type { MutationConfig } from "@/lib/react-query"
import type { PlayerEditInput } from "@/lib/schemas/player"

export async function updatePlayer({
  id,
  avatarBlob,
  ...raw
}: PlayerEditInput & { id: string; avatarBlob?: Blob }) {
  const input = playerEditSchema.parse(raw)
  const supabase = getSupabaseBrowserClient()
  // upload first, row second: a failed upload leaves the row untouched,
  // and a failed row update after a good upload is benign — the object
  // path is fixed, so avatar_url still points at the old ?v= version
  const avatar_url = avatarBlob ? await uploadAvatar(id, avatarBlob) : undefined
  const { error } = await supabase
    .from("players")
    .update({
      name: input.name,
      handedness: input.handedness,
      ...(avatar_url !== undefined && { avatar_url }),
    })
    .eq("id", id)
  if (error) throw error
}

type UseUpdatePlayerOptions = {
  mutationConfig?: MutationConfig<typeof updatePlayer>
}

export function useUpdatePlayer({
  mutationConfig,
}: UseUpdatePlayerOptions = {}) {
  const queryClient = useQueryClient()
  const { onSuccess, ...restConfig } = mutationConfig ?? {}
  return useMutation({
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ["manage"] })
      void queryClient.invalidateQueries({ queryKey: ["players"] })
      // players_headline embeds the name and handedness this edits
      void queryClient.invalidateQueries({
        queryKey: ["insights", "players-headline"],
      })
      onSuccess?.(...args)
    },
    ...restConfig,
    mutationFn: updatePlayer,
  })
}
