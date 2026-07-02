import { expect, test } from "@playwright/test"

// Golden-path harness proof (§8.7 #6 grows from here): the app boots,
// SSRs real content, hydrates, and logs no console errors.
test("app boots and hydrates cleanly", async ({ page }) => {
  const consoleErrors: Array<string> = []
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
  })
  page.on("pageerror", (err) => consoleErrors.push(err.message))

  const response = await page.goto("/")
  expect(response?.status()).toBe(200)

  await expect(page).toHaveTitle(/.+/)
  await expect(page.locator("body")).not.toBeEmpty()

  // Give hydration a beat to surface errors. (Not networkidle — the dev
  // devtools hold a connection open, so idle never arrives.)
  await page.waitForLoadState("load")
  await page.waitForTimeout(750)
  expect(consoleErrors).toEqual([])
})
