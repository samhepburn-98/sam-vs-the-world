import { PGlite } from "@electric-sql/pglite"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { applyMigrations, applyMigrationsFrom } from "./migrations"

// Migration 0004b fixture tests (§8.7 #1): serve_stats + error_profile and
// their companions, including the traps from #23 — a let landing between a
// first-serve fault and its serve-2 replay (the point must count once), a
// single-serve match contributing to serve win % but not serve-number stats,
// and the forced/unforced/untagged three-way.
//
// The suite runs against the FULL migration chain. It used to hand-pick five
// migrations, which froze it at the early-July schema: it seeded an `ace`
// end reason that a CHECK retired on 10 July (20260710160000), so it kept
// asserting an ace count production can no longer produce. Aces are now
// DERIVED — a winner the server took on shot 1 — and the fixture states that
// shape directly.
//
// The one deliberate exception is Pat and Quinn's legacy double_bounce row,
// which has to exist before 20260714120000 retires the value. That pair is
// seeded with the chain stopped just short of the retirement, then the rest
// of the chain runs over it; Sam and Dave are seeded afterwards, so every
// row they own is written against the current schema.

let db: PGlite
let sam: string
let dave: string
let matchTwoServe: string
let matchSingleServe: string
// an isolated pair for the double_bounce retirement — their legacy match is
// seeded BEFORE the retire migration runs, so it never touches Sam and Dave
let pat: string
let quinn: string

interface RallySpec {
  server: string
  winner: string | null
  side?: "left" | "right"
  serveNo?: 1 | 2
  reason?: string
  detail?: string | null
  forced?: boolean | null
  // Rally length, in shots. Every logged rally carries one (the draft opens at
  // 1 — src/lib/rally/rally-draft.ts), and since 20260710160000 it is half of
  // the ace derivation: a winner the server took on ONE shot IS an ace. So a
  // rally that is merely a winner has to state a real length, or serve_stats
  // will rightly count it as an ace.
  shots?: number
}

async function seedGame(
  matchId: string,
  gameNumber: number,
  rallies: Array<RallySpec>
) {
  const game = await db.query<{ id: string }>(
    `insert into games (match_id, game_number) values ($1, $2) returning id`,
    [matchId, gameNumber]
  )
  let n = 0
  for (const r of rallies) {
    n += 1
    await db.query(
      `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, error_detail, forced, shot_count)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        game.rows[0].id,
        n,
        r.server,
        r.side ?? "left",
        r.serveNo ?? 1,
        r.winner,
        r.reason ?? (r.winner === null ? "let" : "winner"),
        r.detail ?? null,
        r.forced ?? null,
        r.shots ?? null,
      ]
    )
  }
  return game.rows[0].id
}

beforeAll(async () => {
  db = new PGlite()

  // Stop one migration short of the double_bounce retirement so the legacy
  // row below can be written the way it was written in June (§8.7 #1).
  await applyMigrations(db, { stopBefore: "retire_double_bounce" })

  // Match 3 — a LEGACY double_bounce error, inserted while the value was
  // still live. The retire migration then runs over it: the row must fold
  // into not_up and the value must be locked out of new rows.
  const p2 = await db.query<{ id: string }>(
    `insert into players (name) values ('Pat'), ('Quinn') returning id`
  )
  ;[pat, quinn] = p2.rows.map((r) => r.id)
  const m3 = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date) values ($1, $2, '2026-06-20') returning id`,
    [pat, quinn]
  )
  await seedGame(m3.rows[0].id, 1, [
    {
      server: pat,
      winner: quinn,
      reason: "error",
      detail: "double_bounce",
      forced: false,
      shots: 5,
    },
  ])

  // …and the rest of the chain, retirement included, over the top of it.
  await applyMigrationsFrom(db, "retire_double_bounce")

  // Match 4 — Pat and Quinn again, at the CURRENT schema: the three shapes
  // the ace derivation has to tell apart (see the serve_stats case below).
  const m4 = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date) values ($1, $2, '2026-06-21') returning id`,
    [pat, quinn]
  )
  await seedGame(m4.rows[0].id, 1, [
    // an ace: Pat's serve, Pat wins it, one shot — the serve itself
    { server: pat, winner: pat, shots: 1 },
    // a winning serve, but a rally was played first — not an ace
    { server: pat, winner: pat, shots: 4 },
    // one shot, but the RETURNER won it — not an ace either
    { server: pat, winner: quinn, shots: 1 },
  ])

  const players = await db.query<{ id: string }>(
    `insert into players (name) values ('Sam'), ('Dave') returning id`
  )
  ;[sam, dave] = players.rows.map((r) => r.id)

  // Match 1 — two serves per point (the default), blue ball.
  const m1 = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date, ball_type) values ($1, $2, '2026-06-01', 'blue') returning id`,
    [sam, dave]
  )
  matchTwoServe = m1.rows[0].id
  await seedGame(matchTwoServe, 1, [
    // 1: Sam serves left, first serve, clean winner off a real rally
    { server: sam, side: "left", serveNo: 1, winner: sam, shots: 7 },
    // 2: Sam's first serve faulted (implicit) → point played on serve 2,
    //    Sam tins it — an unforced error on the right box
    {
      server: sam,
      side: "right",
      serveNo: 2,
      winner: dave,
      reason: "error",
      detail: "tin",
      forced: false,
      shots: 9,
    },
    // 3+4: THE TRAP — first serve faults, then a LET interrupts the serve-2
    //      point; the replay (still serve 2) is the only decided row. The
    //      pair must count as ONE served rally and ONE first-serve fault.
    { server: sam, side: "right", serveNo: 2, winner: null },
    { server: sam, side: "right", serveNo: 2, winner: sam, shots: 5 },
    // 5: Dave aces Sam — since 20260710160000 that is not an end reason but
    //    a shape: a winner, off Dave's own serve, decided on the first shot
    { server: dave, side: "left", serveNo: 1, winner: dave, shots: 1 },
    // 6: Dave double-faults (second-serve fault → receiver wins, by trigger).
    //    Zero shots: the rally never started.
    {
      server: dave,
      side: "left",
      serveNo: 2,
      winner: sam,
      reason: "serve_fault",
      shots: 0,
    },
    // 7: Sam's forced error (out over the front-wall line)
    {
      server: sam,
      side: "left",
      serveNo: 1,
      winner: dave,
      reason: "error",
      detail: "out_top",
      forced: true,
      shots: 12,
    },
    // 8: Sam errs again, nothing tagged — forced NULL, detail NULL
    {
      server: sam,
      side: "left",
      serveNo: 1,
      winner: dave,
      reason: "error",
      shots: 6,
    },
  ])

  // Match 2 — SINGLE-serve squash (§7.7), yellow ball: counts toward serve
  // win % but must stay out of every serve-number stat.
  const m2 = await db.query<{ id: string }>(
    `insert into matches (player1_id, player2_id, date, ball_type, serves_per_point) values ($1, $2, '2026-06-10', 'yellow', 1) returning id`,
    [sam, dave]
  )
  matchSingleServe = m2.rows[0].id
  await seedGame(matchSingleServe, 1, [
    { server: sam, winner: sam, shots: 4 },
    { server: sam, winner: sam, shots: 8 },
    {
      server: sam,
      winner: dave,
      reason: "error",
      detail: "not_up",
      forced: false,
      shots: 6,
    },
  ])
})

afterAll(async () => {
  await db.close()
})

async function serveStats(playerId: string, filters = "") {
  const res = await db.query<Record<string, number>>(
    `select * from serve_stats($1${filters})`,
    [playerId]
  )
  expect(res.rows).toHaveLength(1)
  return res.rows[0]
}

async function errorProfile(playerId: string) {
  const res = await db.query<
    Record<string, number> & { trend: Array<Record<string, unknown>> }
  >(`select * from error_profile($1)`, [playerId])
  expect(res.rows).toHaveLength(1)
  return res.rows[0]
}

describe("serve_stats", () => {
  it("excludes lets from every denominator — the fault-let-replay pair counts once", async () => {
    const s = await serveStats(sam)
    // Sam served 5 decided rallies in match 1 (the let is not one) + 3 in
    // match 2. Rows 2 and 4 played on serve 2 → two first-serve faults.
    expect(s.rallies_served).toBe(8)
    expect(s.serve_wins).toBe(4) // rows 1, 4 + two single-serve wins
    expect(s.first_serve_faults).toBe(2)
  })

  it("computes serve-number stats over two-serve matches only", async () => {
    const s = await serveStats(sam)
    expect(s.two_serve_rallies_served).toBe(5) // match 1 only — not 8
    expect(s.serve1_served).toBe(3)
    expect(s.serve1_wins).toBe(1)
    expect(s.serve2_served).toBe(2)
    expect(s.serve2_wins).toBe(1) // the post-let replay
  })

  it("counts return points, aces and double faults", async () => {
    const s = await serveStats(sam)
    expect(s.rallies_returned).toBe(2) // Dave's two decided serves
    expect(s.return_wins).toBe(1) // Dave's double fault
    expect(s.aces).toBe(0) // Sam wins serves, but never on the serve
    expect(s.double_faults).toBe(0)

    const d = await serveStats(dave)
    expect(d).toMatchObject({
      rallies_served: 2,
      serve_wins: 1,
      aces: 1, // row 5, derived from winner + own serve + one shot
      double_faults: 1,
      rallies_returned: 8,
      return_wins: 4, // rows 2, 7, 8 + the single-serve error
      first_serve_faults: 1, // the double fault was a point on serve 2
    })
  })

  it("derives aces from the rally, not from a stored end reason", async () => {
    // Pat's match 4 holds all three shapes. Only the first is an ace: the
    // server won it, and won it on shot 1 — the serve. The 4-shot winning
    // serve had a rally in it, and the 1-shot rally the RETURNER won came off
    // Pat's racket but was never Pat's point (the winner_id half of the
    // predicate arrived with 20260710160000; 20260706174523 counted any
    // 1-shot rally the player served, whoever won it).
    const p = await serveStats(pat)
    expect(p).toMatchObject({
      rallies_served: 4, // three here + the legacy error in match 3
      serve_wins: 2, // the ace and the 4-shot winner
      aces: 1,
    })
    // Quinn never served, so nothing of Quinn's can be an ace
    const q = await serveStats(quinn)
    expect(q).toMatchObject({ rallies_served: 0, aces: 0 })
  })

  it("rejects the retired 'ace' end reason at the DB", async () => {
    // The value survives in the enum (Postgres cannot drop a member), so only
    // the CHECK from 20260710160000 keeps it out — and this suite is exactly
    // where it would drift back in.
    await expect(
      db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, shot_count)
         select game_id, 99, server_id, 'left', 1, $1, 'ace', 1
         from rallies where server_id = $1 limit 1`,
        [pat]
      )
    ).rejects.toThrow(/rallies_end_reason_current/)
  })

  it("splits win rate by serve side", async () => {
    const s = await serveStats(sam)
    expect(s.left_served).toBe(6) // rows 1, 7, 8 + all three single-serve
    expect(s.left_wins).toBe(3) // row 1 + two single-serve wins
    expect(s.right_served).toBe(2) // rows 2, 4
    expect(s.right_wins).toBe(1) // the replay
  })

  it("applies the cross-cutting filters", async () => {
    const yellow = await db.query<{
      rallies_served: number
      two_serve_rallies_served: number
    }>(
      `select rallies_served, two_serve_rallies_served from serve_stats($1, p_ball_type => 'yellow')`,
      [sam]
    )
    expect(yellow.rows[0]).toMatchObject({
      rallies_served: 3,
      two_serve_rallies_served: 0,
    })
    const dated = await db.query<{ rallies_served: number }>(
      `select rallies_served from serve_stats($1, p_date_to => '2026-06-05')`,
      [sam]
    )
    expect(dated.rows[0].rallies_served).toBe(5)
  })

  it("serve_rallies returns exactly the rows the aggregate counted", async () => {
    const rows = await db.query<{ is_let: boolean; server_id: string }>(
      `select is_let, server_id from serve_rallies($1)`,
      [sam]
    )
    expect(rows.rows).toHaveLength(8) // == rallies_served
    expect(rows.rows.every((r) => !r.is_let && r.server_id === sam)).toBe(true)
  })
})

describe("error_profile", () => {
  it("attributes errors to the non-winner across error and serve_fault", async () => {
    const e = await errorProfile(sam)
    expect(e.errors_total).toBe(4) // rows 2, 7, 8 + the single-serve not_up
    expect(e.games_played).toBe(2)

    const d = await errorProfile(dave)
    expect(d.errors_total).toBe(1) // only the double fault
  })

  it("keeps the forced three-way honest — untagged is never folded in", async () => {
    const e = await errorProfile(sam)
    expect(e.forced_errors).toBe(1)
    expect(e.unforced_errors).toBe(2)
    expect(e.untagged_errors).toBe(1) // row 8: forced NULL stays untagged
    // the three-way spans 'error' rows only — Dave's serve_fault (which can
    // never carry a forced tag) lands in none of them
    const d = await errorProfile(dave)
    expect(d.forced_errors + d.unforced_errors + d.untagged_errors).toBe(0)
    expect(d.detail_untagged).toBe(1)
  })

  it("splits by error detail, with untagged counted separately", async () => {
    const e = await errorProfile(sam)
    expect(e).toMatchObject({
      tin: 1,
      out_top: 1,
      not_up: 1,
      out_side: 0,
      out_back: 0,
      detail_untagged: 1,
    })
  })

  it("retires double_bounce — legacy rows fold into not_up, the column is gone", async () => {
    // Pat's pre-retirement double_bounce error now reads as not_up, so it
    // lands in a visible bucket instead of vanishing from the breakdown
    const e = await errorProfile(pat)
    expect(e.errors_total).toBe(1)
    expect(e.not_up).toBe(1)
    expect(e.detail_untagged).toBe(0)
    // the RPC no longer returns the dead column at all
    expect("double_bounce" in e).toBe(false)
  })

  it("rejects new double_bounce rows at the DB", async () => {
    await expect(
      db.query(
        `insert into rallies (game_id, rally_number, server_id, serve_side, serve_number, winner_id, end_reason, error_detail)
         select game_id, 99, server_id, 'left', 1, $1, 'error', 'double_bounce'
         from rallies where server_id = $2 limit 1`,
        [quinn, pat]
      )
    ).rejects.toThrow(/rallies_error_detail_current/)
  })

  it("returns a date-ascending per-match trend", async () => {
    const e = await errorProfile(sam)
    expect(e.trend).toEqual([
      { match_id: matchTwoServe, date: "2026-06-01", errors: 3, games: 1 },
      { match_id: matchSingleServe, date: "2026-06-10", errors: 1, games: 1 },
    ])
  })

  it("error_rallies returns exactly the rows the aggregate counted", async () => {
    const rows = await db.query<{ end_reason: string; winner_id: string }>(
      `select end_reason, winner_id from error_rallies($1)`,
      [sam]
    )
    expect(rows.rows).toHaveLength(4) // == errors_total
    expect(rows.rows.every((r) => r.winner_id !== sam)).toBe(true)
  })
})

describe("API exposure", () => {
  it.each([
    "serve_stats(uuid, uuid, ball_type, date, date)",
    "serve_rallies(uuid, uuid, ball_type, date, date)",
    "error_profile(uuid, uuid, ball_type, date, date)",
    "error_rallies(uuid, uuid, ball_type, date, date)",
  ])("anon can execute %s", async (signature) => {
    const res = await db.query<{ ok: boolean }>(
      `select has_function_privilege('anon', 'public.${signature}', 'execute') as ok`
    )
    expect(res.rows[0].ok).toBe(true)
  })
})
