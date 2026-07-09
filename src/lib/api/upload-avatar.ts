import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

// Avatar upload (§5.4): one fixed object per player — `{id}.jpg`, upserted —
// so a re-upload replaces the old photo with no orphan cleanup. The stored
// avatar_url is the full public URL with a ?v= cache-buster appended at
// write time: the CDN and the browser both key on the query string, so
// bumping it is what makes the new photo actually show up.

/** The structural slice of the supabase client the upload needs — injectable
 *  so tests can fake it (same pattern as planCreateMatch). */
export interface AvatarStorageClient {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Blob,
        options: { upsert: boolean; contentType: string; cacheControl: string },
      ) => Promise<{ error: { message: string } | null }>
      getPublicUrl: (path: string) => { data: { publicUrl: string } }
    }
  }
}

export function avatarObjectPath(playerId: string): string {
  return `${playerId}.jpg`
}

/** Upload the (already-downscaled) JPEG and return the versioned public URL
 *  to store in players.avatar_url. Throws on failure — the caller must not
 *  touch the row when it does. */
export async function uploadAvatar(
  playerId: string,
  blob: Blob,
  client: AvatarStorageClient = getSupabaseBrowserClient(),
): Promise<string> {
  const bucket = client.storage.from("avatars")
  const path = avatarObjectPath(playerId)
  const { error } = await bucket.upload(path, blob, {
    upsert: true,
    contentType: "image/jpeg",
    cacheControl: "3600",
  })
  if (error) throw error
  return `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
}
