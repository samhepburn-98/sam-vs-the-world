import { expect, test } from "@playwright/test"

// The manage browser is public read (§5.4, §2.5) — all four tabs must be
// browsable logged out. Data-independent assertions: structure, not contents.

test("all four manage tabs are browsable logged-out", async ({ page }) => {
  await page.goto("/manage")
  await page.waitForLoadState("load")
  await page.waitForTimeout(750) // hydration beat (see smoke.spec.ts)

  // no auth redirect — this page is public
  await expect(page).toHaveURL(/\/manage/)

  for (const tab of ["Games", "Rallies", "Players", "Matches"]) {
    await page.getByRole("tab", { name: tab }).click()
    await expect(page.getByRole("tab", { name: tab })).toHaveAttribute(
      "aria-selected",
      "true"
    )
    // the table shell renders: headers now, rows/empty-state once loaded
    await expect(page.getByRole("table")).toBeVisible()
  }

  // tab choice lands in the URL (shareable, back-button friendly)
  await expect(page).toHaveURL(/tab=matches/)

  // write affordances are owner-only — logged out there are none (§5.4)
  await expect(
    page.getByRole("button", { name: /^(Edit|Delete|Insert) / })
  ).toHaveCount(0)
})
