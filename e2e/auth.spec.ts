import { expect, test } from "@playwright/test"

// The /entry guard (§8.5) — UX gate; RLS remains the real lock.

test("unauthenticated /entry redirects to /login", async ({ page }) => {
  await page.goto("/entry")
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
})

test("login page validates without hitting the network", async ({ page }) => {
  await page.goto("/login")
  // give hydration a beat (same rationale as the smoke test — the click must
  // land on the hydrated form, not the static SSR HTML)
  await page.waitForLoadState("load")
  await page.waitForTimeout(750)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page.getByText("Enter a valid email address")).toBeVisible()
})
