import { createClient } from "@supabase/supabase-js"

// The golden path runs ONLY against the local Supabase stack (`supabase
// start`) — never the cloud project (§8.7 #6: test database, not prod).
// These are the CLI's fixed, publicly-documented local dev defaults, the
// same on every machine; nothing here is a secret.

export const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321"

export const LOCAL_PUBLISHABLE_KEY =
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

// the standard local demo service-role JWT (signed with the demo secret)
const LOCAL_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

export const GOLDEN_USER = {
  email: "golden@test.local",
  password: "golden-path-test",
}

/** service-role client — bypasses RLS; local stack only */
export function serviceClient() {
  return createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}
