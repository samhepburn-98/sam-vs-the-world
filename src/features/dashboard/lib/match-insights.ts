import type { PairCount } from "@/features/dashboard/lib/match-stats"
import type { RallyScored } from "@/lib/schemas/rally"
import type { ShotType } from "@/lib/schemas/enums"

// The match page's insight derivations (§5.2): every module is a pure
// function over the folded rallies_scored rows the page already holds —
// the same client-side derive-don't-store rule as match-stats (§8.4
// exception; RPCs are for cross-match aggregation, not rows on hand).
// Anything untagged (no forced call, no shot count, no detail) is counted
// honestly as its own bucket, never silently folded into a guess.

type Side = keyof PairCount

const sideOf = (id: string, p1Id: string): Side => (id === p1Id ? "p1" : "p2")
const other = (s: Side): Side => (s === "p1" ? "p2" : "p1")

/** A decided rally: someone won it. Lets carry no insight. */
const decided = (rows: Array<RallyScored>) =>
  rows.filter(
    (r): r is RallyScored & { winner_id: string } => r.winner_id !== null,
  )

// ---------------------------------------------------------------- sources

/** Where a player's points came from: earned off their own racket (winners,
 *  pressure that forced an error) or gifted (unforced errors — serve faults
 *  included — strokes, and errors nobody tagged). */
export interface PointSources {
  ownWinner: number
  /** opponent errors tagged forced — pressure, so earned */
  forced: number
  /** opponent unforced errors + serve faults — gifts */
  unforced: number
  /** opponent errors with no forced/unforced call */
  untagged: number
  stroke: number
  total: number
}

export function computePointSources(
  rows: Array<RallyScored>,
  p1Id: string,
): Record<Side, PointSources> {
  const empty = (): PointSources => ({
    ownWinner: 0,
    forced: 0,
    unforced: 0,
    untagged: 0,
    stroke: 0,
    total: 0,
  })
  const out: Record<Side, PointSources> = { p1: empty(), p2: empty() }

  for (const r of decided(rows)) {
    const winner = sideOf(r.winner_id, p1Id)
    const s = out[winner]
    s.total += 1
    switch (r.end_reason) {
      case "winner":
      case "ace":
        s.ownWinner += 1
        break
      case "serve_fault":
        s.unforced += 1
        break
      case "error":
        if (r.forced === true) s.forced += 1
        else if (r.forced === false) s.unforced += 1
        else s.untagged += 1
        break
      case "stroke":
        s.stroke += 1
        break
      case "let":
        break
    }
  }
  return out
}

/** Share of points earned off your own racket (winners + forced errors). */
export function earnedShare(s: PointSources): number | null {
  return s.total === 0 ? null : (s.ownWinner + s.forced) / s.total
}

// ----------------------------------------------------------------- length

export interface LengthBucket {
  /** inclusive shot-count range; max null = open-ended */
  min: number
  max: number | null
  won: PairCount
}

export interface RallyLengthSplit {
  buckets: Array<LengthBucket>
  /** decided rallies with no shot count — excluded, not guessed */
  untagged: number
}

export function computeRallyLengthSplit(
  rows: Array<RallyScored>,
  p1Id: string,
): RallyLengthSplit {
  const buckets: Array<LengthBucket> = [
    { min: 1, max: 4, won: { p1: 0, p2: 0 } },
    { min: 5, max: 9, won: { p1: 0, p2: 0 } },
    { min: 10, max: null, won: { p1: 0, p2: 0 } },
  ]
  let untagged = 0
  for (const r of decided(rows)) {
    if (r.shot_count === null) {
      untagged += 1
      continue
    }
    const bucket = buckets.find(
      (b) => r.shot_count >= b.min && (b.max === null || r.shot_count <= b.max),
    )
    if (bucket) bucket.won[sideOf(r.winner_id, p1Id)] += 1
  }
  return { buckets, untagged }
}

// ------------------------------------------------------------------ serve

export interface WonTotal {
  won: number
  total: number
}

export interface ServeInsight {
  /** points decided on this player's serve */
  serve: WonTotal
  /** points decided on the opponent's serve */
  ret: WonTotal
  /** own serve, split by service box */
  leftBox: WonTotal
  rightBox: WonTotal
}

export function computeServeInsights(
  rows: Array<RallyScored>,
  p1Id: string,
): Record<Side, ServeInsight> {
  const empty = (): ServeInsight => ({
    serve: { won: 0, total: 0 },
    ret: { won: 0, total: 0 },
    leftBox: { won: 0, total: 0 },
    rightBox: { won: 0, total: 0 },
  })
  const out: Record<Side, ServeInsight> = { p1: empty(), p2: empty() }

  for (const r of decided(rows)) {
    const server = sideOf(r.server_id, p1Id)
    const winner = sideOf(r.winner_id, p1Id)
    const box = r.serve_side === "left" ? "leftBox" : "rightBox"

    out[server].serve.total += 1
    out[server][box].total += 1
    out[other(server)].ret.total += 1
    if (winner === server) {
      out[server].serve.won += 1
      out[server][box].won += 1
    } else {
      out[winner].ret.won += 1
    }
  }
  return out
}

export function rate(wt: WonTotal): number | null {
  return wt.total === 0 ? null : wt.won / wt.total
}

// ----------------------------------------------------------------- errors

/** A player's errors (serve faults included) by where the ball went. */
export interface ErrorBreakdown {
  tin: number
  /** out top + side + back, together — "out" is the story, not the wall */
  out: number
  notUp: number
  /** no detail tagged (legacy double bounces land here too) */
  other: number
  /** how many of the total were tagged unforced */
  unforced: number
  total: number
}

export function computeErrorBreakdown(
  rows: Array<RallyScored>,
  p1Id: string,
): Record<Side, ErrorBreakdown> {
  const empty = (): ErrorBreakdown => ({
    tin: 0,
    out: 0,
    notUp: 0,
    other: 0,
    unforced: 0,
    total: 0,
  })
  const out: Record<Side, ErrorBreakdown> = { p1: empty(), p2: empty() }

  for (const r of decided(rows)) {
    if (r.end_reason !== "error" && r.end_reason !== "serve_fault") continue
    const maker = other(sideOf(r.winner_id, p1Id))
    const e = out[maker]
    e.total += 1
    if (r.forced === false) e.unforced += 1
    switch (r.error_detail) {
      case "tin":
        e.tin += 1
        break
      case "out_top":
      case "out_side":
      case "out_back":
        e.out += 1
        break
      case "not_up":
        e.notUp += 1
        break
      default:
        e.other += 1
    }
  }
  return out
}

// ------------------------------------------------------------------ shots

export interface WinningShots {
  /** typed winners, most-used first (ties break alphabetically) */
  shots: Array<{ shot: ShotType; count: number }>
  untyped: number
  total: number
}

export function computeWinningShots(
  rows: Array<RallyScored>,
  p1Id: string,
): Record<Side, WinningShots> {
  const tallies: Record<Side, Map<ShotType, number>> = {
    p1: new Map(),
    p2: new Map(),
  }
  const out: Record<Side, WinningShots> = {
    p1: { shots: [], untyped: 0, total: 0 },
    p2: { shots: [], untyped: 0, total: 0 },
  }

  for (const r of decided(rows)) {
    if (r.end_reason !== "winner" && r.end_reason !== "ace") continue
    const side = sideOf(r.winner_id, p1Id)
    out[side].total += 1
    if (r.shot_type === null) out[side].untyped += 1
    else tallies[side].set(r.shot_type, (tallies[side].get(r.shot_type) ?? 0) + 1)
  }
  for (const side of ["p1", "p2"] as const) {
    out[side].shots = [...tallies[side].entries()]
      .map(([shot, count]) => ({ shot, count }))
      .sort((a, b) => b.count - a.count || a.shot.localeCompare(b.shot))
  }
  return out
}

// ------------------------------------------------------------------ story

/** One deterministic sentence that reads the numbers and states the
 *  headline — the biggest true thing, never a guess. Null when there's no
 *  winner or too little data to say anything with a straight face. */
export function buildMatchStory(
  rows: Array<RallyScored>,
  p1Id: string,
  p1Name: string,
  p2Name: string,
): string | null {
  const sources = computePointSources(rows, p1Id)
  const totalPoints = sources.p1.total + sources.p2.total
  if (totalPoints < 20 || sources.p1.total === sources.p2.total) return null

  const winner: Side = sources.p1.total > sources.p2.total ? "p1" : "p2"
  const loser = other(winner)
  const name: Record<Side, string> = { p1: p1Name, p2: p2Name }
  const w = sources[winner]
  const l = sources[loser]
  const wEarned = earnedShare(w)
  const lEarned = earnedShare(l)
  const gifts = w.unforced + w.untagged

  // the crossover: the loser played the better squash and gave it away
  if (
    wEarned !== null &&
    lEarned !== null &&
    lEarned > wEarned &&
    gifts / w.total > 0.5
  ) {
    return `${name[loser]} played the better squash — ${Math.round(lEarned * 100)}% of their points came off their own racket. But they handed ${name[winner]} ${gifts} unforced errors, and that was the match.`
  }

  // decided on mistakes
  const errors = computeErrorBreakdown(rows, p1Id)
  const wErr = errors[winner]
  const lErr = errors[loser]
  if (lErr.total >= 10 && lErr.total >= wErr.total * 1.8) {
    return `${name[loser]} made ${lErr.total} errors to ${name[winner]}'s ${wErr.total} — this one was decided on mistakes, not winners.`
  }

  // the grind
  const { buckets } = computeRallyLengthSplit(rows, p1Id)
  const long = buckets[2]
  const short = buckets[0]
  const longTotal = long.won.p1 + long.won.p2
  const shortTotal = short.won.p1 + short.won.p2
  if (longTotal >= 8 && shortTotal > 0) {
    const longRate = long.won[winner] / longTotal
    const shortRate = short.won[winner] / shortTotal
    if (longRate >= 0.7 && shortRate <= 0.55) {
      return `${name[winner]} won the war of attrition — ${Math.round(longRate * 100)}% of rallies past 9 shots, while the quick exchanges stayed even.`
    }
  }

  // the serve
  const serve = computeServeInsights(rows, p1Id)
  const sRate = rate(serve[winner].serve)
  const rRate = rate(serve[winner].ret)
  if (
    sRate !== null &&
    rRate !== null &&
    serve[winner].serve.total >= 20 &&
    sRate - rRate >= 0.35
  ) {
    return `${name[winner]}'s serve carried this — ${Math.round(sRate * 100)}% of points behind it, only ${Math.round(rRate * 100)}% on return.`
  }

  // sheer winners
  if (w.ownWinner >= 12 && w.ownWinner >= l.ownWinner * 1.7) {
    return `${name[winner]} simply hit more winners — ${w.ownWinner} to ${l.ownWinner}.`
  }

  return `${name[winner]} outscored ${name[loser]} ${w.total}–${l.total} across ${rows.length} rallies.`
}
