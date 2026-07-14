import { describe, expect, it } from "vitest"

import { avatarObjectPath, uploadAvatar } from "./upload-avatar"

import type { AvatarStorageClient } from "./upload-avatar"

const PLAYER = "11111111-1111-4111-8111-111111111111"

function fakeClient(uploadError: { message: string } | null = null) {
  const uploads: Array<{
    bucket: string
    path: string
    options: Record<string, unknown>
  }> = []
  const client: AvatarStorageClient = {
    storage: {
      from(bucket) {
        return {
          upload(path, _body, options) {
            uploads.push({ bucket, path, options })
            return Promise.resolve({ error: uploadError })
          },
          getPublicUrl(path) {
            return {
              data: { publicUrl: `https://cdn.test/avatars/${path}` },
            }
          },
        }
      },
    },
  }
  return { client, uploads }
}

describe("uploadAvatar", () => {
  it("upserts a jpeg at the player's fixed path", async () => {
    const { client, uploads } = fakeClient()
    await uploadAvatar(PLAYER, new Blob(), client)

    expect(uploads).toHaveLength(1)
    expect(uploads[0].bucket).toBe("avatars")
    expect(uploads[0].path).toBe(avatarObjectPath(PLAYER))
    expect(uploads[0].options).toMatchObject({
      upsert: true,
      contentType: "image/jpeg",
    })
  })

  it("returns the public URL with a numeric cache-buster", async () => {
    const { client } = fakeClient()
    const url = await uploadAvatar(PLAYER, new Blob(), client)

    const [base, query] = url.split("?")
    expect(base).toBe(`https://cdn.test/avatars/${PLAYER}.jpg`)
    expect(query).toMatch(/^v=\d+$/)
  })

  it("throws on upload failure so the row is never touched", async () => {
    const { client } = fakeClient({ message: "Payload too large" })
    await expect(
      uploadAvatar(PLAYER, new Blob(), client)
    ).rejects.toMatchObject({ message: "Payload too large" })
  })
})
