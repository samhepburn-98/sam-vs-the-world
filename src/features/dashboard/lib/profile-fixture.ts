import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"
import type { SignatureTrait } from "@/features/dashboard/schemas/insights"
import type { Handedness } from "@/lib/schemas/enums"

// The redesigned player profile, first pass: one fixture drives the whole
// page so the structure can be judged before any wiring. Every shape here is
// deliberately close to what the insight RPCs already return — hooking up
// real data should mean replacing this object with mapped payloads, not
// reshaping components. Numbers are internally consistent (the KPIs, curve
// buckets, error counts, and h2h rows all describe the same fictional
// season) so the page reads as a real player, not lorem ipsum.

export interface ProfileKpi {
  value: string
  label: string
  detail: string
  /** The hero number gets the accent colour. */
  accent?: boolean
}

export interface ProfileInsight {
  eyebrow: string
  title: string
  body: string
  /** One insight per group carries the highlight treatment. */
  highlight?: boolean
}

export interface ErrorWallCounts {
  tin: number
  outTop: number
  outSide: number
  outBack: number
  notUp: number
  /** Tin's share of all errors, pre-formatted for the wall label. */
  tinShare: string
}

export interface HistoryMatch {
  date: string
  opponent: string
  won: boolean
  result: string
  /** Per-game scores, this player first (e.g. "11-7") — the table derives
   *  each pill's won/lost styling from the two numbers. */
  games: Array<string>
  note: string
}

export interface CurveBucket {
  label: string
  rallies: number
  winRate: number
}

export interface PressureRow {
  label: string
  won: number
  of: number
}

export interface ShareRow {
  label: string
  count: number
  /** Share of the group, 0–100, for the bar width. */
  share: number
}

export interface ServeBoxes {
  left: { won: number; of: number }
  right: { won: number; of: number }
  aces: number
  doubleFaults: number
}

export interface H2hRow {
  rival: string
  matches: string
  games: string
  /** Games won share, 0–100. */
  share: number
  lastWon: boolean
}

export interface RecentMatch {
  date: string
  opponent: string
  won: boolean
  result: string
}

export interface ProfileFixture {
  name: string
  handedness: Handedness
  trait: SignatureTrait
  signature: string
  meta: string
  card: {
    hero: { display: string; label: string }
    attrs: Array<PlayerAttribute>
  }
  kpis: Array<ProfileKpi>
  shape: {
    lede: string
    insights: Array<ProfileInsight>
  }
  errors: {
    lede: string
    wall: ErrorWallCounts
    insights: Array<ProfileInsight>
  }
  season: {
    lede: string
    /** Game results oldest to newest. */
    games: Array<boolean>
  }
  history: {
    lede: string
    matches: Array<HistoryMatch>
    foldNote: string
  }
  stats: {
    curve: Array<CurveBucket>
    pressure: { rows: Array<PressureRow>; read: string }
    serve: ServeBoxes
    pointEnders: { rows: Array<ShareRow>; read: string }
    errorsGiven: { rows: Array<ShareRow>; read: string }
    h2h: { rows: Array<H2hRow>; read: string }
    recent: Array<RecentMatch>
  }
}

const attr = (
  key: PlayerAttribute["key"],
  code: string,
  detail: string,
  value: number,
  sr: string
): PlayerAttribute => ({ key, code, detail, value, display: String(value), sr })

// 40 games, 24 won: a six-game run mid-season, ending W W L W L.
const SEASON_GAMES = "WWLWWWWWWLLWLWLWWLLWWWLLWLWWLWLWWLLWWLWL"

export const PROFILE_FIXTURE: ProfileFixture = {
  name: "Sam",
  handedness: "right",
  trait: "shotmaker",
  signature: "Wins 52% of 1–3 shot rallies — strongest when it's quick.",
  meta: "Right-handed · 40 games across 12 matches",
  card: {
    hero: { display: "58%", label: "Win rate" },
    attrs: [
      attr(
        "srv",
        "SRV",
        "Points won on your own serve",
        66,
        "79 of 119 serve rallies won"
      ),
      attr(
        "ret",
        "RET",
        "Points won when receiving serve",
        39,
        "41 of 105 return rallies won"
      ),
      attr(
        "att",
        "ATT",
        "Short rallies (1–4 shots) won",
        52,
        "84 of 163 short rallies won"
      ),
      attr(
        "con",
        "CON",
        "Errors you forced, not gifted cheaply",
        65,
        "35 of 54 tagged errors were forced"
      ),
      attr(
        "grd",
        "GRD",
        "Extended rallies (5+ shots) won",
        59,
        "36 of 61 extended rallies won"
      ),
      attr(
        "clu",
        "CLU",
        "Points won from 9–all",
        49,
        "17 of 35 points from 9–all won"
      ),
    ],
  },
  kpis: [
    { value: "58%", label: "Win rate", detail: "24–16 games", accent: true },
    { value: "7–5", label: "Matches", detail: "3 went to a fifth" },
    { value: "4.2", label: "Avg rally", detail: "longest 34" },
    { value: "6", label: "Best streak", detail: "points in a row" },
    { value: "3", label: "Comebacks", detail: "won from 8+ down" },
    { value: "65%", label: "Errors forced", detail: "35 of 54 tagged" },
  ],
  shape: {
    lede: "Six measured win rates — never invented ratings. The silhouette leans hard toward serve and control; the return corner is where the work is.",
    insights: [
      {
        eyebrow: "Strength",
        title: "The serve is the weapon.",
        body: "66% of points won behind your own serve — and 71% from the left box. The point is often over before the rally starts: 6 aces, and a third of serve points won inside 3 shots.",
        highlight: true,
      },
      {
        eyebrow: "Weakness",
        title: "The return game leaks.",
        body: "Just 39% of points won when receiving — a 27-point gap off the serve number. The biggest single number to move.",
      },
      {
        eyebrow: "Pattern",
        title: "Force the error, don't gift one.",
        body: "65% of tagged errors in your rallies were forced by your shot — the drive does most of that work (34 decisive drives vs 21 drops, 11 boasts).",
      },
    ],
  },
  errors: {
    lede: "Every error given away, mapped to how it ended. Nearly half hit the tin — the price of playing the ball an inch above it.",
    wall: {
      tin: 24,
      outTop: 3,
      outSide: 9,
      outBack: 5,
      notUp: 11,
      tinShare: "46% of everything given away",
    },
    insights: [
      {
        eyebrow: "The tin tax",
        title: "24 points paid to the tin.",
        body: "That's a full lost game and a half. Most came on attacking drops — the same shot that earns 21 winners. High reward, and here's the receipt.",
        highlight: true,
      },
      {
        eyebrow: "The trade",
        title: "The aggression still profits.",
        body: "35 errors forced against 38 unforced given away — plus 41 clean winners on top. The attacking ledger closes well in credit.",
      },
      {
        eyebrow: "If one thing changes",
        title: "Halve the tins, win the h2h.",
        body: "Against Woody, tins alone account for 9 of the game margin. Trading 12 tins for lets would flip two of the five matches.",
      },
    ],
  },
  season: {
    lede: "All 40 games in order. The six-in-a-row run through late June is the best stretch logged; it ended the night the return stats fell off.",
    games: SEASON_GAMES.split("").map((g) => g === "W"),
  },
  history: {
    lede: "Most recent first. Each row will open the full rally-by-rally log.",
    matches: [
      {
        date: "9 Jul",
        opponent: "Woody",
        won: true,
        result: "3–1",
        games: ["11-7", "8-11", "11-9", "11-5"],
        note: "Longest rally of the season — 34 shots",
      },
      {
        date: "6 Jul",
        opponent: "Woody",
        won: false,
        result: "1–3",
        games: ["9-11", "11-8", "7-11", "8-11"],
        note: "All three 9–all points lost",
      },
      {
        date: "2 Jul",
        opponent: "Charlie",
        won: true,
        result: "3–0",
        games: ["11-5", "11-7", "11-8"],
        note: "6-point streak in game one",
      },
      {
        date: "28 Jun",
        opponent: "Woody",
        won: true,
        result: "3–2",
        games: ["11-9", "9-11", "13-11", "6-11", "11-9"],
        note: "Comeback from 8–10 in the third",
      },
      {
        date: "24 Jun",
        opponent: "Jack",
        won: false,
        result: "2–3",
        games: ["8-11", "11-6", "11-9", "5-11", "9-11"],
        note: "7 tins — the worst error night logged",
      },
      {
        date: "21 Jun",
        opponent: "Charlie",
        won: true,
        result: "3–1",
        games: ["11-8", "11-9", "10-12", "11-4"],
        note: "3 aces — season best",
      },
      {
        date: "18 Jun",
        opponent: "Woody",
        won: false,
        result: "0–3",
        games: ["6-11", "9-11", "7-11"],
        note: "Won just 31% of return points",
      },
      {
        date: "14 Jun",
        opponent: "Jack",
        won: false,
        result: "1–3",
        games: ["9-11", "11-7", "8-11", "10-12"],
        note: "Two games lost from game ball up",
      },
    ],
    foldNote: "4 earlier matches load below this fold.",
  },
  stats: {
    curve: [
      { label: "1–3 shots · 89", rallies: 89, winRate: 52 },
      { label: "4–6 · 74", rallies: 74, winRate: 58 },
      { label: "7–9 · 41", rallies: 41, winRate: 58 },
      { label: "10+ · 20", rallies: 20, winRate: 45 },
    ],
    pressure: {
      rows: [
        { label: "From 9–all", won: 17, of: 35 },
        { label: "Game balls held", won: 19, of: 28 },
        { label: "Game balls saved", won: 6, of: 25 },
        { label: "Fifth games", won: 2, of: 3 },
      ],
      read: "Solid serving out a game; streaky once it's 9–all.",
    },
    serve: {
      left: { won: 34, of: 48 },
      right: { won: 45, of: 71 },
      aces: 6,
      doubleFaults: 4,
    },
    pointEnders: {
      rows: [
        { label: "Drive", count: 34, share: 52 },
        { label: "Drop", count: 21, share: 32 },
        { label: "Boast", count: 11, share: 17 },
      ],
      read: "66 decisive shots tagged.",
    },
    errorsGiven: {
      rows: [
        { label: "Tin", count: 24, share: 46 },
        { label: "Not up", count: 11, share: 21 },
        { label: "Out", count: 17, share: 33 },
      ],
      read: "52 total · 38 unforced, 14 forced out of you.",
    },
    h2h: {
      rows: [
        {
          rival: "Woody",
          matches: "3–2",
          games: "10–8",
          share: 56,
          lastWon: true,
        },
        {
          rival: "Charlie",
          matches: "3–1",
          games: "9–4",
          share: 69,
          lastWon: true,
        },
        {
          rival: "Jack",
          matches: "1–2",
          games: "5–4",
          share: 56,
          lastWon: false,
        },
      ],
      read: "Jack is the puzzle — winning the games but losing the matches. Both defeats went the distance.",
    },
    recent: [
      { date: "9 Jul", opponent: "Woody", won: true, result: "3–1" },
      { date: "6 Jul", opponent: "Woody", won: false, result: "1–3" },
      { date: "2 Jul", opponent: "Charlie", won: true, result: "3–0" },
      { date: "28 Jun", opponent: "Woody", won: true, result: "3–2" },
      { date: "24 Jun", opponent: "Jack", won: false, result: "2–3" },
    ],
  },
}
