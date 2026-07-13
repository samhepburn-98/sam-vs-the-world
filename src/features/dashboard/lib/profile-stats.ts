import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type {
  CurveBucket,
  PressureRow,
  ServeBoxes,
  ShareRow,
} from "@/features/dashboard/lib/profile-fixture"

// Maps the insight payloads onto the Stats tab's RPC-backed cards — the seam
// for the bento the way computeProfileHeader is for the header. The five
// cards with an existing RPC live here: the rally-length curve (rally_lengths,
// three buckets 1–3 / 4–8 / 9+), the phase win rates (momentum, replacing the
// old game-ball "pressure record" the data can't back), serve boxes
// (serve_stats), point-enders (decisive_shots), and errors given
// (error_profile). Every rate guards its own denominator so an empty bucket
// reads as a dash, never a NaN.

export interface ProfileStatsData {
  curve: Array<CurveBucket>
  phases: { rows: Array<PressureRow>; read: string }
  serve: ServeBoxes
  pointEnders: { rows: Array<ShareRow>; read: string }
  errorsGiven: { rows: Array<ShareRow>; read: string }
}

function winRate(wins: number, rallies: number): number | null {
  return rallies > 0 ? Math.round((wins / rallies) * 100) : null
}

function share(count: number, of: number): number {
  return of > 0 ? Math.round((count / of) * 100) : 0
}

/** The three length buckets the rally_lengths RPC pins: 1–3, 4–8, 9+. */
function buildCurve(data: PlayerData): Array<CurveBucket> {
  const r = data.rally
  const bucket = (
    label: string,
    wins: number | undefined,
    rallies: number | undefined
  ): CurveBucket => ({
    label: `${label} · ${rallies ?? 0}`,
    rallies: rallies ?? 0,
    winRate: winRate(wins ?? 0, rallies ?? 0),
  })
  return [
    bucket("1–3", r?.short_wins, r?.short_rallies),
    bucket("4–8", r?.medium_wins, r?.medium_rallies),
    bucket("9+", r?.long_wins, r?.long_rallies),
  ]
}

/** Win rate across the three score bands momentum tags: early, mid, and close
 *  (the top third — from 9-all up at target 11). Replaces the game-ball
 *  "pressure record" the data can't yet back. */
function buildPhases(data: PlayerData): {
  rows: Array<PressureRow>
  read: string
} {
  const m = data.momentum
  const rows: Array<PressureRow> = [
    { label: "Early", won: m?.early_wins ?? 0, of: m?.early_rallies ?? 0 },
    { label: "Mid", won: m?.mid_wins ?? 0, of: m?.mid_rallies ?? 0 },
    { label: "From 9–all", won: m?.close_wins ?? 0, of: m?.close_rallies ?? 0 },
  ]

  const early = winRate(rows[0].won, rows[0].of)
  const close = winRate(rows[2].won, rows[2].of)
  let read = "Win rate as each game moves from its opening to its close."
  if (early != null && close != null) {
    if (close >= early + 5) read = "Raises their level when the game tightens."
    else if (close <= early - 5) read = "Strong early, leakier once it's close."
    else read = "Holds a steady level from the first point to the last."
  }
  return { rows, read }
}

/** The winner's decisive shots — drive/drop/boast — behind the player's own
 *  points won. Shares are of the tagged total, and the read names it. */
function buildPointEnders(data: PlayerData): {
  rows: Array<ShareRow>
  read: string
} {
  const d = data.decisive
  const drive = d?.winning_drive ?? 0
  const drop = d?.winning_drop ?? 0
  const boast = d?.winning_boast ?? 0
  const total = drive + drop + boast
  const rows: Array<ShareRow> = [
    { label: "Drive", count: drive, share: share(drive, total) },
    { label: "Drop", count: drop, share: share(drop, total) },
    { label: "Boast", count: boast, share: share(boast, total) },
  ]
  const read =
    total > 0
      ? `${total} decisive ${total === 1 ? "shot" : "shots"} tagged.`
      : "No decisive shots tagged yet."
  return { rows, read }
}

function buildServe(data: PlayerData): ServeBoxes {
  const s = data.serve
  return {
    left: { won: s?.left_wins ?? 0, of: s?.left_served ?? 0 },
    right: { won: s?.right_wins ?? 0, of: s?.right_served ?? 0 },
    aces: s?.aces ?? 0,
    doubleFaults: s?.double_faults ?? 0,
  }
}

function buildErrorsGiven(data: PlayerData): {
  rows: Array<ShareRow>
  read: string
} {
  const e = data.error
  const total = e?.errors_total ?? 0
  const out = (e?.out_top ?? 0) + (e?.out_side ?? 0) + (e?.out_back ?? 0)
  const rows: Array<ShareRow> = [
    { label: "Tin", count: e?.tin ?? 0, share: share(e?.tin ?? 0, total) },
    {
      label: "Not up",
      count: e?.not_up ?? 0,
      share: share(e?.not_up ?? 0, total),
    },
    { label: "Out", count: out, share: share(out, total) },
  ]
  const read = `${total} total · ${e?.unforced_errors ?? 0} unforced, ${e?.forced_errors ?? 0} forced out of you`
  return { rows, read }
}

export function computeProfileStats(data: PlayerData): ProfileStatsData {
  return {
    curve: buildCurve(data),
    phases: buildPhases(data),
    serve: buildServe(data),
    pointEnders: buildPointEnders(data),
    errorsGiven: buildErrorsGiven(data),
  }
}
