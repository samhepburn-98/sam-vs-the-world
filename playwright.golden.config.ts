import { defineConfig, devices } from "@playwright/test"

import {
  LOCAL_PUBLISHABLE_KEY,
  LOCAL_SUPABASE_URL,
} from "./e2e/golden/local-stack"

// The golden path (§8.7 #6): UI → queue → DB → derived views, end to end,
// against the LOCAL Supabase stack only. Requires `supabase start` first;
// run with `pnpm test:golden`. Its own port so it never collides with the
// regular e2e server (3210) or a manual dev server (3000).
const PORT = 3211

export default defineConfig({
  testDir: "./e2e/golden",
  globalSetup: "./e2e/golden/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0, // a retry would hide flakiness in the one test that proves the pipeline
  // this single test drives login → 5 rallies → finish → reload → manage edits.
  // It runs in ~7s, but a cold Vite dev server plus a router navigation mid-flow
  // can push it past Playwright's 30s default, which then reads as a hang.
  timeout: 90_000,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    // never reuse: a leftover server could be bound to the cloud env
    reuseExistingServer: false,
    stdout: "ignore",
    env: {
      VITE_SUPABASE_URL: LOCAL_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: LOCAL_PUBLISHABLE_KEY,
    },
  },
})
