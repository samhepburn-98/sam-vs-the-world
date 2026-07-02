import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseEnv } from "./env"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

let client: SupabaseClient<Database> | undefined

export function getSupabaseBrowserClient() {
  if (!client) {
    const { url, key } = getSupabaseEnv()
    client = createBrowserClient<Database>(url, key)
  }
  return client
}
