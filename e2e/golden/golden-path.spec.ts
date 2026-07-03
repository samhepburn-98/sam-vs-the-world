import { expect, test } from "@playwright/test"

import { GOLDEN_USER, serviceClient } from "./local-stack"

import type { Page } from "@playwright/test"

// The one integration test proving the whole pipeline (§8.7 #6):
// login → create players + match in the UI → log a game by hotkey (mixed
// outcomes: winner, let, double fault, forced tin, ace) → finish → assert
// the DB rows AND the derived views AND the re-rendered derived score.

async function createPlayerInline(page: Page, slot: string, name: string) {
  await page.locator(`#${slot}`).click()
  await page.getByRole("option", { name: "New player…" }).click()
  await page.getByPlaceholder("Player name").fill(name)
  await page.getByRole("button", { name: "Add", exact: true }).click()
  // the select now shows the created player — RHF holds its id
  await expect(page.locator(`#${slot}`)).toContainText(name)
}

test("golden path: a match logged end-to-end lands derived-correct", async ({
  page,
}) => {
  // ---- login ----------------------------------------------------------
  await page.goto("/login")
  await page.waitForLoadState("load")
  await page.waitForTimeout(750) // hydration beat (see e2e/auth.spec.ts)
  await page.getByLabel(/email/i).fill(GOLDEN_USER.email)
  await page.getByLabel(/password/i).fill(GOLDEN_USER.password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/entry$/)

  // ---- match setup: inline-created players, target 3, casual ----------
  await createPlayerInline(page, "player1", "Golden Sam")
  await createPlayerInline(page, "player2", "Golden Dave")
  await page.getByRole("radio", { name: "Golden Sam" }).click() // serves first
  await page.locator("#target").fill("3")
  await page.getByRole("button", { name: "Start logging" }).click()

  // the logger is up: 0–0, Sam holds the serving dot
  await expect(page.getByText("Game 1 ·")).toBeVisible()

  // ---- log 5 rallies keyboard-only (§5.3 map) --------------------------
  const rally = async (keys: Array<string>, expectRallies: number) => {
    for (const k of keys) await page.keyboard.press(k)
    await expect(
      page.getByRole("list", { name: "Rally timeline" }).getByRole("listitem"),
    ).toHaveCount(expectRallies)
  }

  await rally(["s", "w", "Enter"], 1) // Sam hits a winner        1–0
  await rally(["l"], 2) //              let — replay, score holds  1–0
  await rally(["d", "f", "Enter"], 3) // double fault by Sam      1–1
  await rally(["s", "e", "t", "g", "Enter"], 4) // Dave tin, forced 2–1
  await rally(["s", "a", "Enter"], 5) // Sam aces                 3–1

  // banner fires off the derived score at target 3, win by 2
  await expect(page.getByRole("status")).toContainText("Game 1 to Golden Sam")
  await expect(page.getByRole("status")).toContainText("3–1")

  // every queued write confirmed before we look at the DB
  await expect(page.getByText("Synced ✓")).toBeVisible()

  // ---- finish → derived summary ----------------------------------------
  await page.getByRole("button", { name: "Finish match" }).click()
  await expect(page.getByText("Golden Sam wins 1–0")).toBeVisible()
  await expect(
    page.getByRole("listitem").filter({ hasText: "Game 1" }),
  ).toContainText("3–1")

  // ---- DB state: rows landed exactly as logged -------------------------
  const db = serviceClient()

  const players = await db.from("players").select("id, name").order("name")
  expect(players.error).toBeNull()
  expect(players.data!.map((p) => p.name)).toEqual([
    "Golden Dave",
    "Golden Sam",
  ])
  const sam = players.data!.find((p) => p.name === "Golden Sam")!
  const dave = players.data!.find((p) => p.name === "Golden Dave")!

  const matches = await db
    .from("matches")
    .select("id, player1_id, player2_id, format, target_score")
  expect(matches.error).toBeNull()
  expect(matches.data).toHaveLength(1)
  const match = matches.data![0]
  expect(match).toMatchObject({
    player1_id: sam.id,
    player2_id: dave.id,
    format: null,
    target_score: 3,
  })

  const games = await db.from("games").select("id, game_number")
  expect(games.data).toHaveLength(1)

  const rallies = await db
    .from("rallies")
    .select("rally_number, server_id, serve_number, winner_id, end_reason, error_detail, forced")
    .order("rally_number")
  expect(rallies.error).toBeNull()
  expect(rallies.data).toEqual([
    expect.objectContaining({
      rally_number: 1,
      server_id: sam.id,
      winner_id: sam.id,
      end_reason: "winner",
    }),
    expect.objectContaining({
      rally_number: 2,
      end_reason: "let",
      winner_id: null,
    }),
    expect.objectContaining({
      rally_number: 3,
      end_reason: "serve_fault",
      server_id: sam.id, // the state machine corrected the server to the loser
      serve_number: 2, //   …and the fault to serve 2: a true double fault
      winner_id: dave.id,
    }),
    expect.objectContaining({
      rally_number: 4,
      end_reason: "error",
      error_detail: "tin",
      forced: true,
      winner_id: sam.id,
    }),
    expect.objectContaining({
      rally_number: 5,
      end_reason: "ace",
      server_id: sam.id, // an ace is served by its winner
      winner_id: sam.id,
    }),
  ])

  // ---- derived views: the DB agrees with the UI -------------------------
  const gameResults = await db
    .from("game_results")
    .select("winner_id, score_p1, score_p2, is_undecided")
  expect(gameResults.error).toBeNull()
  expect(gameResults.data).toEqual([
    expect.objectContaining({
      winner_id: sam.id,
      score_p1: 3,
      score_p2: 1,
      is_undecided: false,
    }),
  ])

  const matchResults = await db
    .from("match_results")
    .select("match_winner_id, games_won_p1, games_won_p2")
  expect(matchResults.data).toEqual([
    expect.objectContaining({
      match_winner_id: sam.id,
      games_won_p1: 1,
      games_won_p2: 0,
    }),
  ])

  // ---- rendered derived output survives a full reload -------------------
  await page.getByRole("button", { name: "Done" }).click()
  await page.reload()
  await page.waitForLoadState("load")
  await page.waitForTimeout(750)
  await expect(page.getByText("Golden Sam vs Golden Dave")).toBeVisible()
  await page.getByRole("button", { name: "Open", exact: true }).click() // reopen
  await expect(page.getByRole("status")).toContainText("Game 1 to Golden Sam")
  await expect(page.getByRole("status")).toContainText("3–1")

  // ---- manage: owner editing through the raw browser (§5.4) -------------
  await page.goto("/manage?tab=rallies")
  await page.waitForLoadState("load")
  await page.waitForTimeout(750)

  // insert a missed let before rally #2 — insert_rally_at renumbers the rest
  await page.getByRole("button", { name: "Insert a rally before #2" }).click()
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByRole("dialog")).toBeHidden()

  const afterInsert = await db
    .from("rallies")
    .select("rally_number, end_reason")
    .order("rally_number")
  expect(afterInsert.data!.map((r) => r.end_reason)).toEqual([
    "winner",
    "let", // the insert, renumbered into place…
    "let", // …the original #2, shifted to #3
    "serve_fault",
    "error",
    "ace",
  ])
  // a let holds the score: the derived result is untouched
  const afterInsertResult = await db
    .from("game_results")
    .select("score_p1, score_p2")
  expect(afterInsertResult.data![0]).toMatchObject({ score_p1: 3, score_p2: 1 })

  // edit rally #1: flip the winner — the derivation self-heals downstream
  await page.getByRole("button", { name: "Edit rally #1" }).click()
  await page.getByRole("radio", { name: "Golden Dave" }).click()
  await page.getByRole("button", { name: "Save changes" }).click()
  await expect(page.getByRole("dialog")).toBeHidden()

  const afterEdit = await db
    .from("game_results")
    .select("score_p1, score_p2, winner_id, is_undecided")
  expect(afterEdit.data![0]).toMatchObject({
    score_p1: 2,
    score_p2: 2,
    winner_id: null,
    is_undecided: true, // 2–2 at the last rally: no leader, honestly derived
  })
})
