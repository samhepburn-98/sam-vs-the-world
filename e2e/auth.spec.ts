import { expect, test } from "@playwright/test"

import { waitForHydration } from "./hydration"

// The /entry guard (§8.5) — UX gate; RLS remains the real lock.

test("unauthenticated /entry redirects to /login", async ({ page }) => {
  await page.goto("/entry")
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
})

test("login page validates without hitting the network", async ({ page }) => {
  const posts: Array<string> = []
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url())
  })

  await page.goto("/login")
  await page.waitForLoadState("load")
  // the click must land on the hydrated form, not the static SSR HTML
  await waitForHydration(page, "form")
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page.getByText("Enter a valid email address")).toBeVisible()
  await expect(page.getByText("Enter your password")).toBeVisible()
  expect(posts).toEqual([]) // "without hitting the network", asserted
})
