import type { ErrorClass } from "./write-queue"

// Maps Supabase/PostgREST failures onto the queue's three outcomes.
//
// - Network-level failures (fetch TypeError, 5xx, 408/429) are transient →
//   retry with backoff.
// - 23505 unique_violation means a retried write actually landed the first
//   time (client-generated UUIDs make this the idempotency signal) → success.
// - Everything else — constraint violations (23xxx), RLS denials (42501),
//   4xx — is a real bug or a real rejection → hard-pause, never skip past.

export function classifySupabaseWriteError(error: unknown): ErrorClass {
  if (error instanceof TypeError) return "retryable" // fetch network failure

  const e = error as {
    code?: string
    status?: number
    message?: string
  } | null

  if (e?.code === "23505") return "already_applied"

  if (typeof e?.status === "number") {
    if (e.status >= 500 || e.status === 408 || e.status === 429) {
      return "retryable"
    }
  }

  return "permanent"
}
