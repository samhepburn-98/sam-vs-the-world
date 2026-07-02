import { createServerFn } from "@tanstack/react-start"

import { loginSchema } from "@/lib/schemas/auth"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// Auth server functions — cookie sessions via @supabase/ssr, so the session
// is shared between SSR loaders and the browser client. RLS remains the real
// lock (§8.5); everything here is UX.

export interface SessionUser {
  id: string
  email: string | null
}

export const fetchUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<SessionUser | null> => {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    if (!data.user) return null
    return { id: data.user.id, email: data.user.email ?? null }
  },
)

export const signIn = createServerFn({ method: "POST" })
  .inputValidator(loginSchema)
  .handler(async ({ data }): Promise<{ error: string | null }> => {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      // Friendly, never the raw API error (§5.3)
      return {
        error:
          error.code === "invalid_credentials"
            ? "Wrong email or password."
            : "Couldn't sign in. Try again.",
      }
    }
    return { error: null }
  })

export const signOut = createServerFn({ method: "POST" }).handler(
  async () => {
    const supabase = getSupabaseServerClient()
    await supabase.auth.signOut()
    return { ok: true }
  },
)
