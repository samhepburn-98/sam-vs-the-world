import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseEnv } from "./env"

import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | undefined

export function getSupabaseBrowserClient() {
  if (!client) {
    const { url, key } = getSupabaseEnv()
    client = createBrowserClient(url, key)
  }
  return client
}
