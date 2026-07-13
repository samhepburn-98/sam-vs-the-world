import {
  MIN_ERRORS_FOR_RATE,
  MIN_MATCHES_FOR_TREND,
} from "@/features/dashboard/utils/insight-thresholds"

import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type { ProfileInsight } from "@/features/dashboard/lib/profile-types"
import type { ErrorProfile } from "@/features/dashboard/schemas/insights"

// "Where the errors die": the error wall's counts plus three deterministic
// reads off error_profile — computeProfileShape's sibling. The biggest-leak
// card follows whichever zone actually leads (the fixture's "tin tax"
// assumed the tin; real players leak elsewhere), the ledger reads the
// forced/unforced split, and the third card picks from a salience-ranked
// bank with an errors-per-game fallback so it always renders. This lib
// decides every word; ErrorWall and the insight cards just draw it.

/** The five wall zones, counts only — the wall computes its own emphasis. */
export interface ErrorWallCounts {
  tin: number
  outTop: number
  outSide: number
  outBack: number
  notUp: number
}

export interface ErrorsInsights {
  lede: string
  wall: ErrorWallCounts
  insights: [ProfileInsight, ProfileInsight, ProfileInsight]
}

type ZoneKey = keyof ErrorWallCounts

const ERRORS_LEDE_BASE = "Every error given away, drawn where it died."

function pct(part: number, of: number): number {
  return Math.round((part / of) * 100)
}

function buildWall(e: ErrorProfile | undefined): ErrorWallCounts {
  return {
    tin: e?.tin ?? 0,
    outTop: e?.out_top ?? 0,
    outSide: e?.out_side ?? 0,
    outBack: e?.out_back ?? 0,
    notUp: e?.not_up ?? 0,
  }
}

/** The zone with the most errors; ties break in wall order (tin first),
 *  matching the shape lib's stable-pick rule. */
export function biggestZone(wall: ErrorWallCounts): ZoneKey {
  const order: Array<ZoneKey> = ["tin", "outTop", "outSide", "outBack", "notUp"]
  return order.reduce((best, key) => (wall[key] > wall[best] ? key : best))
}

const located = (wall: ErrorWallCounts) =>
  wall.tin + wall.outTop + wall.outSide + wall.outBack + wall.notUp

/** One strength-of-voice template per zone for the biggest-leak card, plus
 *  the lede phrase that names the same zone in running text. */
const ZONE_COPY: Record<
  ZoneKey,
  { title: string; phrase: string; body: (n: number, of: number) => string }
> = {
  tin: {
    title: "The tin takes the most.",
    phrase: "hit the tin",
    body: (n, of) =>
      `${n} of ${of} located errors died in the tin — ${pct(n, of)}% of everything given away, each one a rally that was alive an inch higher.`,
  },
  notUp: {
    title: "The ball isn't getting there.",
    phrase: "were not up — dead before the front wall",
    body: (n, of) =>
      `${n} of ${of} located errors were not up — ${pct(n, of)}% of the leak happens before the front wall even matters.`,
  },
  outTop: {
    title: "Too much air.",
    phrase: "flew out over the front wall",
    body: (n, of) =>
      `${n} of ${of} located errors sailed out over the front wall — ${pct(n, of)}% of everything given away.`,
  },
  outSide: {
    title: "The side walls bite.",
    phrase: "went out off the side walls",
    body: (n, of) =>
      `${n} of ${of} located errors went out off the side walls — ${pct(n, of)}% of everything given away.`,
  },
  outBack: {
    title: "Long by a length.",
    phrase: "carried out past the back wall",
    body: (n, of) =>
      `${n} of ${of} located errors carried out past the back wall — ${pct(n, of)}% of everything given away.`,
  },
}

const LEAK_FALLBACK: ProfileInsight = {
  eyebrow: "The biggest leak",
  title: "Too early to call.",
  body: "Not enough errors carry a location yet — the wall lights up where the leak is once more are tagged.",
  highlight: true,
}

function buildLeak(wall: ErrorWallCounts): ProfileInsight {
  const of = located(wall)
  if (of < MIN_ERRORS_FOR_RATE) return LEAK_FALLBACK
  const zone = biggestZone(wall)
  return {
    eyebrow: "The biggest leak",
    title: ZONE_COPY[zone].title,
    body: ZONE_COPY[zone].body(wall[zone], of),
    highlight: true,
  }
}

function buildLedger(e: ErrorProfile | undefined): ProfileInsight {
  const forced = e?.forced_errors ?? 0
  const unforced = e?.unforced_errors ?? 0
  const tagged = forced + unforced
  if (tagged < MIN_ERRORS_FOR_RATE) {
    return {
      eyebrow: "The ledger",
      title: "Too early to call.",
      body: "Tag errors as forced or unforced and this ledger fills in.",
    }
  }
  if (unforced > forced) {
    return {
      eyebrow: "The ledger",
      title: "More gifts than forced errors.",
      body: `${unforced} of ${tagged} tagged errors were unforced giveaways; only ${forced} were forced out of you. The cheapest points to stop conceding.`,
    }
  }
  if (forced > unforced) {
    return {
      eyebrow: "The ledger",
      title: "They have to earn it.",
      body: `${forced} of ${tagged} tagged errors were forced by the opponent's shot; only ${unforced} were gifts. The errors you give are mostly paid for.`,
    }
  }
  return {
    eyebrow: "The ledger",
    title: "An even ledger.",
    body: `Exactly half of ${tagged} tagged errors were forced, half unforced giveaways.`,
  }
}

/** Same candidate machinery as the shape lib's Pattern card: predicates,
 *  salience in rough percentage points, and a dedupe root so the third card
 *  never re-tells the biggest-leak card. */
interface PatternCandidate {
  roots: Array<ZoneKey>
  salience: number
  insight: ProfileInsight
}

/** Errors-per-game across the first and last halves of the match trend. */
function trendPattern(e: ErrorProfile | undefined): PatternCandidate | null {
  const trend = e?.trend ?? []
  if (trend.length < MIN_MATCHES_FOR_TREND) return null
  const half = Math.floor(trend.length / 2)
  const rate = (slice: typeof trend) => {
    const errors = slice.reduce((sum, t) => sum + t.errors, 0)
    const games = slice.reduce((sum, t) => sum + t.games, 0)
    return games > 0 ? errors / games : null
  }
  const early = rate(trend.slice(0, half))
  const late = rate(trend.slice(trend.length - half))
  if (early === null || late === null) return null
  const delta = early - late
  if (Math.abs(delta) < 1) return null
  return {
    roots: [],
    salience: Math.abs(delta) * 10,
    insight:
      delta > 0
        ? {
            eyebrow: "The trend",
            title: "The errors are drying up.",
            body: `From ${early.toFixed(1)} errors a game over the first ${half} matches to ${late.toFixed(1)} over the last ${half}.`,
          }
        : {
            eyebrow: "The trend",
            title: "The errors are creeping up.",
            body: `From ${early.toFixed(1)} errors a game over the first ${half} matches to ${late.toFixed(1)} over the last ${half}.`,
          },
  }
}

/** The three out zones as one family — where the over-hit balls go. */
function outFamilyPattern(wall: ErrorWallCounts): PatternCandidate | null {
  const out = wall.outTop + wall.outSide + wall.outBack
  const of = located(wall)
  if (out < 5 || of === 0) return null
  return {
    roots: ["outTop", "outSide", "outBack"],
    salience: pct(out, of),
    insight: {
      eyebrow: "The out column",
      title: "Out, three ways.",
      body: `${out} balls flew out — ${wall.outTop} over the front wall, ${wall.outSide} off the sides, ${wall.outBack} past the back.`,
    },
  }
}

/** Untagged errors dull every other read — worth saying when they pile up. */
function untaggedPattern(e: ErrorProfile | undefined): PatternCandidate | null {
  if (!e || e.errors_total === 0) return null
  const missing = e.detail_untagged + e.untagged_errors
  const share = pct(missing, e.errors_total)
  if (share < 20) return null
  return {
    roots: [],
    salience: share,
    insight: {
      eyebrow: "Housekeeping",
      title: "Tags are missing.",
      body: `${e.detail_untagged} errors have no location and ${e.untagged_errors} no forced call — tag them and this wall sharpens.`,
    },
  }
}

/** Always renders: the plain error rate, available from the first game. */
function fallbackPattern(e: ErrorProfile | undefined): ProfileInsight {
  if (!e || e.games_played === 0) {
    return {
      eyebrow: "The baseline",
      title: "Nothing to map yet.",
      body: "Errors will land on the wall as rallies are logged.",
    }
  }
  return {
    eyebrow: "The baseline",
    title: "The going rate.",
    body: `${e.errors_total} errors across ${e.games_played} games — about ${(e.errors_total / e.games_played).toFixed(1)} given away per game.`,
  }
}

function pickPattern(
  e: ErrorProfile | undefined,
  wall: ErrorWallCounts,
  leakZone: ZoneKey | null
): ProfileInsight {
  const candidates = [
    trendPattern(e),
    outFamilyPattern(wall),
    untaggedPattern(e),
  ]
    .filter((c): c is PatternCandidate => c !== null)
    .filter((c) => leakZone === null || !c.roots.includes(leakZone))
    .sort((a, b) => b.salience - a.salience)
  return candidates[0]?.insight ?? fallbackPattern(e)
}

export function computeProfileErrors(data: PlayerData): ErrorsInsights {
  const e = data.error
  const wall = buildWall(e)
  const of = located(wall)

  const leakZone = of >= MIN_ERRORS_FOR_RATE ? biggestZone(wall) : null
  const leak = buildLeak(wall)
  const ledger = buildLedger(e)
  const pattern = pickPattern(e, wall, leakZone)

  const lede = leakZone
    ? `${ERRORS_LEDE_BASE} ${pct(wall[leakZone], of)}% of them ${ZONE_COPY[leakZone].phrase}.`
    : `${ERRORS_LEDE_BASE} The wall fills in as errors are tagged with a location.`

  return { lede, wall, insights: [leak, ledger, pattern] }
}
