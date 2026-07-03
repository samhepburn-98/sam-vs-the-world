import { defineConfig, devices } from "@playwright/test"

// E2E runs against the dev server on a dedicated port so it never
// collides with a manually running `pnpm dev` (3000).
const PORT = 3210

export default defineConfig({
  testDir: "./e2e",
  // the golden path has its own config (local Supabase stack required)
  testIgnore: "**/golden/**",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
  },
})
