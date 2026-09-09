import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { applyMigrations, applyMigrationsFrom } from "./migrations"

// House-rules enforcement (§7.7, migration 0005) — the serve rules moved from
// a blind CHECK into the rule-aware validation trigger; this suite pins both
// regimes and the guards around them.
//
// It runs against the whole migration set (§8.7 #1). Hand-picking
// enums_and_tables + house_rules froze the suite at 2 July, and a serve rule
// is only meaningful against the row shape the database actually stores: every
// rally written here was judged by a two-day-old rallies table, so the suite
// would have gone on reporting "house rules enforced" while accepting end
// reasons the 10 July CHECK retired. The retirement is pinned below.

let db: PGlite
let p1 = ""
let p2 = ""

async function makeMatch(
  servesPerPoint: 1 | 2,
  [left, right]: [string, string] = [p1, p2]
) {
  const m = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, serves_per_point)
     values ($1, $2, $3) returning id`,
    [left, right, servesPerPoint]
  )
  const g = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, 1) returning id`,
    [m.rows[0].id]
  )
  return { matchId: m.rows[0].id, gameId: g.rows[0].id }
}

function insertRally(
  gameId: string,
  n: number,
  serveNumber: number,
  endReason: string,
  winner: string,
  // the server defaults to p1 (the serve rules don't care who serves); shot
  // count stays null unless a case is about rally length, because a 1-shot
  // winner to the server is what an ace is now made of (§7.7)
  options: { server?: string; shotCount?: number } = {}
) {
  return db.query(
    `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
     values ($1, $2, $3, 'left', $4, $5, $6, $7)`,
    [
      gameId,
      n,
      options.server ?? p1,
      serveNumber,
      winner,
      endReason,
      options.shotCount ?? null,
    ]
  )
}

beforeAll(async () => {
  db = new PGlite()
  await applyMigrations(db)
  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('hr-p1'), ('hr-p2') returning id`
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
      /second-serve fault/
    )
  })

  it("accepts a double fault (serve 2)", async () => {
    const { gameId } = await makeMatch(2)
    await expect(
      insertRally(gameId, 1, 2, "serve_fault", p2)
    ).resolves.toBeDefined()
  })
})

describe("single-serve match (serves_per_point = 1)", () => {
  it("accepts a point ending on a first-serve fault", async () => {
    const { gameId } = await makeMatch(1)
    await expect(
      insertRally(gameId, 1, 1, "serve_fault", p2)
    ).resolves.toBeDefined()
  })

  it("rejects serve_number 2 entirely", async () => {
    const { gameId } = await makeMatch(1)
    await expect(insertRally(gameId, 1, 2, "winner", p1)).rejects.toThrow(
      /exceeds the match's serves_per_point/
    )
  })
})

describe("house-rule guards", () => {
  it("locks serves_per_point once the match has games", async () => {
    const { matchId } = await makeMatch(1)
    await expect(
      db.query(`update matches set serves_per_point = 2 where id = $1`, [
        matchId,
      ])
    ).rejects.toThrow(/serve rules on a match that already has games/)
  })

  it("still allows changing serves_per_point before any games exist", async () => {
    const m = await db.query<{ id: string }>(
      `insert into matches (player1_id, player2_id, serves_per_point)
       values ($1, $2, 1) returning id`,
      [p1, p2]
    )
    await expect(
      db.query(`update matches set serves_per_point = 2 where id = $1`, [
        m.rows[0].id,
      ])
    ).resolves.toBeDefined()
  })

  it("accepts any odd best-of format 1-9, rejects even", async () => {
    for (const format of [1, 7, 9]) {
      await expect(
        db.query(
          `insert into matches (player1_id, player2_id, format) values ($1, $2, $3)`,
          [p1, p2, format]
        )
      ).resolves.toBeDefined()
    }
    await expect(
      db.query(
        `insert into matches (player1_id, player2_id, format) values ($1, $2, 4)`,
        [p1, p2]
      )
    ).rejects.toThrow()
  })
})

// The serve rules decide when a point may end on the serve; they say nothing
// about what that point is called. 'ace' was the old name and is retired
// (20260710160000) — an ace is now derived: a winner the server took on one
// shot. Pinned here because the trigger this suite exercises waves 'ace'
// straight through, so only the table's CHECK stands between this file and a
// silent drift back to writing a value production rejects.
describe("points ending on the serve (the retired 'ace')", () => {
  it("rejects the retired 'ace' end reason under either serve rule", async () => {
    for (const spp of [1, 2] as const) {
      const { gameId } = await makeMatch(spp)
      await expect(insertRally(gameId, 1, 1, "ace", p1)).rejects.toThrow(
        /rallies_end_reason_current/
      )
    }
  })

  it("takes the ace as a 1-shot winner to the server, and derives it back out", async () => {
    // own players: serve_stats aggregates every match a player appears in, so
    // the fixture has to be the only thing it can see
    const fresh = await db.query<{ id: string }>(
      `insert into players (name) values ('hr-server'), ('hr-receiver') returning id`
    )
    const [server, receiver] = fresh.rows.map((r) => r.id)
    const { gameId } = await makeMatch(1, [server, receiver])

    // rally 1: the ace — server wins on serve 1, one shot played
    await expect(
      insertRally(gameId, 1, 1, "winner", server, { server, shotCount: 1 })
    ).resolves.toBeDefined()
    // rally 2: a plain winner to the same server. It needs a real rally length
    // or the derivation counts it as a second ace
    await expect(
      insertRally(gameId, 2, 1, "winner", server, { server, shotCount: 7 })
    ).resolves.toBeDefined()

    const stats = await db.query<{ aces: number; serve_wins: number }>(
      `select aces, serve_wins from serve_stats($1)`,
      [server]
    )
    expect(stats.rows[0]).toEqual({ aces: 1, serve_wins: 2 })
  })
})

// The before/after the first describe only claims. "Prior behaviour" was a
// blind CHECK (rallies_fault_second_serve) that rejected a first-serve fault
// on every match, because there was no serves_per_point to ask — house_rules
// dropped it and handed the decision to the trigger. stopBefore writes the
// rally the way the old schema judged it; applyMigrationsFrom then brings the
// same database forward so the identical rally can be re-judged.
describe("the rule's before and after", () => {
  let legacy: PGlite
  let l1 = ""
  let l2 = ""

  beforeAll(async () => {
    legacy = new PGlite()
    await applyMigrations(legacy, { stopBefore: "house_rules" })
    const players = await legacy.query<{ id: string }>(
      `insert into players (name) values ('pre-p1'), ('pre-p2') returning id`
    )
    l1 = players.rows[0].id
    l2 = players.rows[1].id
  })

  afterAll(async () => {
    await legacy.close()
  })

  // serves_per_point only exists after house_rules, and the guard locks it the
  // moment a game exists — so it has to be set on the insert, not after
  async function legacyGame(servesPerPoint?: 1 | 2) {
    const m =
      servesPerPoint === undefined
        ? await legacy.query<{ id: string }>(
            `insert into matches (player1_id, player2_id) values ($1, $2) returning id`,
            [l1, l2]
          )
        : await legacy.query<{ id: string }>(
            `insert into matches (player1_id, player2_id, serves_per_point)
             values ($1, $2, $3) returning id`,
            [l1, l2, servesPerPoint]
          )
    const g = await legacy.query<{ id: string }>(
      `insert into games (match_id, game_number) values ($1, 1) returning id`,
      [m.rows[0].id]
    )
    return { matchId: m.rows[0].id, gameId: g.rows[0].id }
  }

  function legacyFirstServeFault(gameId: string) {
    return legacy.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason)
       values ($1, 1, $2, 'left', 1, $3, 'serve_fault')`,
      [gameId, l1, l2]
    )
  }

  it("was a blind CHECK before house_rules, a per-match rule after it", async () => {
    // before: no serves_per_point column to consult, so the table itself
    // refuses — a single-serve match was simply unloggable
    const old = await legacyGame()
    await expect(legacyFirstServeFault(old.gameId)).rejects.toThrow(
      /rallies_fault_second_serve/
    )

    await applyMigrationsFrom(legacy, "house_rules")

    // after: the same rally is legal, provided the match says one serve
    const single = await legacyGame(1)
    await expect(legacyFirstServeFault(single.gameId)).resolves.toBeDefined()

    // ...and still refused where the match says two, now by the trigger
    const double = await legacyGame(2)
    await expect(legacyFirstServeFault(double.gameId)).rejects.toThrow(
      /second-serve fault/
    )
  })
})
