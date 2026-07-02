import { describe, expect, it } from "vitest"

import { getSupabaseBrowserClient } from "./browser"

// Connectivity smoke test — skipped when no .env is present (e.g. CI),
// so the suite stays green without credentials.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const hasEnv = Boolean(url && key)

describe.skipIf(!hasEnv)("supabase connectivity", () => {
  it("reaches the project with the configured key", async () => {
    // Auth health accepts the publishable key; the REST root (/rest/v1/)
    // is OpenAPI introspection and 401s for non-JWT keys, so don't use it.
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
    })
    expect(res.status).toBe(200)
  })

  it("round-trips through the supabase client", async () => {
    const supabase = getSupabaseBrowserClient()
    // deliberately nonexistent RPC (hence the cast past the typed client):
    // the PGRST202 reply below can only come from the real database gateway
    const { error } = await supabase.rpc("health_check" as never)
    // No schema exists yet: a PostgREST "function not found" error proves
    // the request reached the database gateway (a network/auth failure
    // would surface as a fetch error or 401 instead).
    expect(error).not.toBeNull()
    expect(error!.code).toBe("PGRST202")
  })
})
