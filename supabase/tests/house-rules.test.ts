import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// House-rules enforcement (§7.7, migration 0005) — the serve rules moved from
// a blind CHECK into the rule-aware validation trigger; this suite pins both
// regimes and the guards around them.

const MIGRATIONS = join(__dirname, "../migrations")

function loadMigration(nameFragment: string) {
  const file = readdirSync(MIGRATIONS).find((f) => f.includes(nameFragment))
  if (!file) throw new Error(`migration matching "${nameFragment}" not found`)
  return readFileSync(join(MIGRATIONS, file), "utf8").replace(
    /^create extension if not exists pgcrypto;$/m,
    "",
  )
}

let db: PGlite
let p1 = ""
let p2 = ""

async function makeMatch(servesPerPoint: 1 | 2) {
  const m = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, serves_per_point)
     values ($1, $2, $3) returning id`,
    [p1, p2, servesPerPoint],
  )
  const g = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, 1) returning id`,
    [m.rows[0].id],
  )
  return { matchId: m.rows[0].id, gameId: g.rows[0].id }
}

function insertRally(
  gameId: string,
  n: number,
  serveNumber: number,
  endReason: string,
  winner: string,
) {
  return db.query(
    `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
     values ($1, $2, $3, 'left', $4, $5, $6)`,
    [gameId, n, p1, serveNumber, winner, endReason],
  )
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(loadMigration("enums_and_tables"))
  await db.exec(loadMigration("house_rules"))
  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('hr-p1'), ('hr-p2') returning id`,
  )
  p1 = players.rows[0].id
  p2 = players.rows[1].id
})

afterAll(async () => {
  await db.close()
})

describe("two-serve match (default — prior behaviour preserved)", () => {
  it("rejects a point ending on a first-serve fault", async () => {
    const { gameId } = await makeMatch(2)
    await expect(insertRally(gameId, 1, 1, "serve_fault", p2)).rejects.toThrow(
      /second-serve fault/,
    )
  })

  it("accepts a double fault (serve 2)", async () => {
    const { gameId } = await makeMatch(2)
    await expect(
      insertRally(gameId, 1, 2, "serve_fault", p2),
    ).resolves.toBeDefined()
  })
})

describe("single-serve match (serves_per_point = 1)", () => {
  it("accepts a point ending on a first-serve fault", async () => {
    const { gameId } = await makeMatch(1)
    await expect(
      insertRally(gameId, 1, 1, "serve_fault", p2),
    ).resolves.toBeDefined()
  })

  it("rejects serve_number 2 entirely", async () => {
    const { gameId } = await makeMatch(1)
    await expect(insertRally(gameId, 1, 2, "winner", p1)).rejects.toThrow(
      /exceeds the match's serves_per_point/,
    )
  })
})

describe("house-rule guards", () => {
  it("locks serves_per_point once the match has games", async () => {
    const { matchId } = await makeMatch(1)
    await expect(
      db.query(`update matches set serves_per_point = 2 where id = $1`, [
        matchId,
      ]),
    ).rejects.toThrow(/serve rules on a match that already has games/)
  })

  it("still allows changing serves_per_point before any games exist", async () => {
    const m = await db.query<{ id: string }>(
      `insert into matches (player1_id, player2_id, serves_per_point)
       values ($1, $2, 1) returning id`,
      [p1, p2],
    )
    await expect(
      db.query(`update matches set serves_per_point = 2 where id = $1`, [
        m.rows[0].id,
      ]),
    ).resolves.toBeDefined()
  })

  it("accepts any odd best-of format 1-9, rejects even", async () => {
    for (const format of [1, 7, 9]) {
      await expect(
        db.query(
          `insert into matches (player1_id, player2_id, format) values ($1, $2, $3)`,
          [p1, p2, format],
        ),
      ).resolves.toBeDefined()
    }
    await expect(
      db.query(
        `insert into matches (player1_id, player2_id, format) values ($1, $2, 4)`,
        [p1, p2],
      ),
    ).rejects.toThrow()
  })
})
