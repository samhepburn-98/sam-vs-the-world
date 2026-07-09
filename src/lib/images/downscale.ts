// Client-side avatar downscaling: a phone photo is 3–12 MB but the card
// renders at well under 800px, so shrinking before upload keeps the bucket
// small and the upload quick — the bucket's 2 MiB server cap is a backstop,
// not something a normal save should ever meet. Always re-encodes as JPEG:
// Safari's canvas.toBlob can't reliably produce WebP, and a constant output
// format keeps the storage path/content-type fixed.

/** Aspect-preserving fit inside a square of `maxEdge`. Never upscales. */
export function fitWithin(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }
  const scale = maxEdge / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/** Raised when the file can't be decoded as an image (wrong type, corrupt). */
export class NotAnImageError extends Error {
  constructor() {
    super("That doesn't look like an image — use a JPEG or PNG.")
    this.name = "NotAnImageError"
  }
}

/** Decode → shrink → re-encode as JPEG. Browser-only (canvas); the sizing
 *  logic lives in {@link fitWithin} so it stays unit-testable. */
export async function downscaleImage(
  file: Blob,
  { maxEdge = 800, quality = 0.85 } = {},
): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new NotAnImageError()
  })
  const size = fitWithin(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement("canvas")
  canvas.width = size.width
  canvas.height = size.height
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, size.width, size.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality)
  })
  if (!blob) throw new NotAnImageError()
  return blob
}
