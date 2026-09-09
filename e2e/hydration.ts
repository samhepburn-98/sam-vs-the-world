import type { Page } from "@playwright/test"

// The app SSRs, so the markup is on screen and clickable before React has
// attached a single handler. A click in that window lands on inert HTML and is
// silently lost — the test then waits for something that will never happen.
//
// The specs papered over this with `waitForTimeout(750)`, which does not remove
// the race, only guesses at it: on a loaded machine the beat is too short and
// the click vanishes. That is what made the login specs fail intermittently —
// the form was fine, the click never reached it.
//
// Wait for the actual signal instead. React attaches its fiber/props keys to
// host nodes as it hydrates, so their presence means handlers are live. It is
// per-root, so any node inside the app proves the whole tree is ready.

export async function waitForHydration(
  page: Page,
  selector = "button"
): Promise<void> {
  await page.waitForFunction(
    (sel: string) => {
      const el = document.querySelector(sel)
      return el !== null && Object.keys(el).some((k) => k.startsWith("__react"))
    },
    selector,
    { timeout: 20_000 }
  )
}
