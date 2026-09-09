import { getSupabaseBrowserClient } from "@/lib/supabase/browser"

// Avatar upload: one object per player per format — `{id}.png` for a
// transparent cutout, `{id}.jpg` for a photo — upserted, so a re-upload of
// the same format replaces the old one with no orphan cleanup (switching
// format once leaves the other extension behind, harmlessly unreferenced).
// The stored avatar_url is the full public URL with a ?v= cache-buster
// appended at write time: the CDN and the browser both key on the query
// string, so bumping it is what makes the new photo actually show up.

/** The structural slice of the supabase client the upload needs — injectable
 *  so tests can fake it (same pattern as createMatchWithGame). */
export interface AvatarStorageClient {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Blob,
        options: { upsert: boolean; contentType: string; cacheControl: string }
      ) => Promise<{ error: { message: string } | null }>
      getPublicUrl: (path: string) => { data: { publicUrl: string } }
    }
  }
}

export function avatarObjectPath(playerId: string, blobType?: string): string {
  const ext = blobType === "image/png" ? "png" : "jpg"
  return `${playerId}.${ext}`
}

/** Upload the (already-downscaled) blob and return the versioned public URL
 *  to store in players.avatar_url. The extension and content-type follow the
 *  blob's own type so a PNG cutout keeps its transparency. Throws on failure
 *  — the caller must not touch the row when it does. */
export async function uploadAvatar(
  playerId: string,
  blob: Blob,
  client: AvatarStorageClient = getSupabaseBrowserClient()
): Promise<string> {
  const bucket = client.storage.from("avatars")
  const path = avatarObjectPath(playerId, blob.type)
  const contentType = blob.type === "image/png" ? "image/png" : "image/jpeg"
  const { error } = await bucket.upload(path, blob, {
    upsert: true,
    contentType,
    cacheControl: "3600",
  })
  if (error) throw error
  return `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
}
