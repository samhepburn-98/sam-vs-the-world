import { createServerClient } from "@supabase/ssr"
import { getCookies, setCookie } from "@tanstack/react-start/server"

import { getSupabaseEnv } from "./env"

import type { Database } from "@/lib/database.types"

// Per-request server client — call inside a server function, loader, or
// request handler (the cookie helpers need an active request context).
export function getSupabaseServerClient() {
  const { url, key } = getSupabaseEnv()
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookies) {
        for (const cookie of cookies) {
          setCookie(cookie.name, cookie.value, cookie.options)
        }
      },
    },
  })
}
