import {
  ATTRIBUTE_META,
  computePlayerAttributes,
  playerTrait,
  TRAIT_META,
} from "@/features/dashboard/lib/player-attributes"
import {
  MIN_BOX_SERVES,
  MIN_DECISIVE_FOR_MIX,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/lib/insight-thresholds"

import type {
  AttributeKey,
  PlayerAttribute,
  PlayerData,
} from "@/features/dashboard/lib/player-attributes"
import type { ProfileInsight } from "@/features/dashboard/lib/profile-types"

// "The shape of the game": three deterministic reads off the same data the
// radar draws — no invented numbers, no free text. Strength and Weakness are
// the radar's extremes (each attribute owns one strength-voiced and one
// weakness-voiced template; the data picks which renders). Pattern is the
// axis the radar can't show — asymmetries and tendencies across rallies —
// chosen from a candidate bank by salience, with a rally-shape fallback so
// the card always renders. Same seam as computeProfileHeader: this lib
// decides every word, the component just lays it out.

export interface ShapeInsights {
  lede: string
  insights: [ProfileInsight, ProfileInsight, ProfileInsight]
}

const SHAPE_LEDE_BASE =
  "Six win rates, each measured from real rallies — never invented ratings."

/** A rated attribute paired with the sentence pair it can voice. */
interface AttributeCopy {
  strength: (a: PlayerAttribute, d: PlayerData) => ProfileInsight
  weakness: (a: PlayerAttribute, d: PlayerData) => ProfileInsight
}

function pct(won: number, of: number): number {
  return Math.round((won / of) * 100)
}

/** RET copy names the gap off the serve number when both rates exist —
 *  the pair is the game's biggest lever, so the sentence should point at it. */
function serveGap(d: PlayerData): number | null {
  const s = d.serve
  if (
    !s ||
    s.rallies_served < MIN_RALLIES_FOR_RATE ||
    s.rallies_returned < MIN_RALLIES_FOR_RATE
  ) {
    return null
  }
  return (
    pct(s.serve_wins, s.rallies_served) - pct(s.return_wins, s.rallies_returned)
  )
}

const ATTRIBUTE_COPY: Record<AttributeKey, AttributeCopy> = {
  srv: {
    strength: (a, d) => ({
      eyebrow: "Strength",
      title: "The serve is the weapon.",
      body: `${a.value}% of points won behind your own serve — ${d.serve?.serve_wins} of ${d.serve?.rallies_served} serve rallies. The point starts on your terms.`,
      highlight: true,
    }),
    weakness: (a, d) => ({
      eyebrow: "Weakness",
      title: "The serve isn't earning its keep.",
      body: `Only ${a.value}% of points won on your own serve — ${d.serve?.serve_wins} of ${d.serve?.rallies_served}. The advantage is being handed straight back.`,
    }),
  },
  ret: {
    strength: (a, d) => ({
      eyebrow: "Strength",
      title: "The return takes the serve away.",
      body: `${a.value}% of points won when receiving — ${d.serve?.return_wins} of ${d.serve?.rallies_returned} return rallies against the server's advantage.`,
      highlight: true,
    }),
    weakness: (a, d) => {
      const gap = serveGap(d)
      return {
        eyebrow: "Weakness",
        title: "The return game leaks.",
        body:
          `Just ${a.value}% of points won when receiving — ${d.serve?.return_wins} of ${d.serve?.rallies_returned} return rallies.` +
          (gap != null && gap >= 10
            ? ` A ${gap}-point gap off the serve number, and the biggest single number to move.`
            : " The biggest single number to move."),
      }
    },
  },
  att: {
    strength: (a, d) => ({
      eyebrow: "Strength",
      title: "Short points, quick kills.",
      body: `${a.value}% of short rallies won — ${d.rally?.short_wins} of ${d.rally?.short_rallies} decided inside four shots. The first opening usually lands.`,
      highlight: true,
    }),
    weakness: (a, d) => ({
      eyebrow: "Weakness",
      title: "Short rallies slip away.",
      body: `Only ${a.value}% of rallies decided inside four shots go your way — ${d.rally?.short_wins} of ${d.rally?.short_rallies}. First strike is going to the other side.`,
    }),
  },
  con: {
    strength: (a, d) => ({
      eyebrow: "Strength",
      title: "Nothing given cheaply.",
      body: `${a.value}% of your errors were forced out of you — only ${d.error?.unforced_errors} unforced giveaways in ${(d.error?.forced_errors ?? 0) + (d.error?.unforced_errors ?? 0)} tagged errors.`,
      highlight: true,
    }),
    weakness: (a, d) => ({
      eyebrow: "Weakness",
      title: "Too many cheap gifts.",
      body: `Only ${a.value}% of your errors were forced — ${d.error?.unforced_errors} of ${(d.error?.forced_errors ?? 0) + (d.error?.unforced_errors ?? 0)} tagged errors were unforced giveaways.`,
    }),
  },
  grd: {
    strength: (a, d) => ({
      eyebrow: "Strength",
      title: "The long rally is home turf.",
      body: `${a.value}% of extended rallies won — ${(d.rally?.medium_wins ?? 0) + (d.rally?.long_wins ?? 0)} of ${(d.rally?.medium_rallies ?? 0) + (d.rally?.long_rallies ?? 0)} at five shots or more. Patience pays.`,
      highlight: true,
    }),
    weakness: (a, d) => ({
      eyebrow: "Weakness",
      title: "Extended rallies drain away.",
      body: `Only ${a.value}% of rallies past four shots won — ${(d.rally?.medium_wins ?? 0) + (d.rally?.long_wins ?? 0)} of ${(d.rally?.medium_rallies ?? 0) + (d.rally?.long_rallies ?? 0)}. The war of attrition isn't being won.`,
    }),
  },
  clu: {
    strength: (a, d) => ({
      eyebrow: "Strength",
      title: "Big points, best squash.",
      body: `${a.value}% of points won from 9–all — ${d.momentum?.close_wins} of ${d.momentum?.close_rallies} in the close phase, when a point is a game.`,
      highlight: true,
    }),
    weakness: (a, d) => ({
      eyebrow: "Weakness",
      title: "The close phase wobbles.",
      body: `Only ${a.value}% of points won from 9–all — ${d.momentum?.close_wins} of ${d.momentum?.close_rallies} when it mattered most.`,
    }),
  },
}

const STRENGTH_FALLBACK: ProfileInsight = {
  eyebrow: "Strength",
  title: "Too early to call.",
  body: "No attribute has enough rallies behind it to name a strength yet — the radar fills in as more play is logged.",
  highlight: true,
}

const WEAKNESS_FALLBACK: ProfileInsight = {
  eyebrow: "Weakness",
  title: "Too early to call.",
  body: "A weakness needs at least two rated attributes to compare. Keep logging.",
}

/** A pattern candidate: does it apply, how loudly (salience, roughly the
 *  size of the gap it names in points), and which attribute it re-tells.
 *  Candidates rooted in the chosen strength or weakness are skipped — the
 *  Pattern card must add a third fact, not repeat one. */
interface PatternCandidate {
  root: AttributeKey | null
  salience: number
  insight: ProfileInsight
}

function boxGapPattern(d: PlayerData): PatternCandidate | null {
  const s = d.serve
  if (!s || s.left_served < MIN_BOX_SERVES || s.right_served < MIN_BOX_SERVES)
    return null
  const left = pct(s.left_wins, s.left_served)
  const right = pct(s.right_wins, s.right_served)
  const gap = Math.abs(left - right)
  if (gap < 10) return null
  const [better, worse, betterPct, worsePct] =
    left > right
      ? (["left", "right", left, right] as const)
      : (["right", "left", right, left] as const)
  return {
    root: "srv",
    salience: gap,
    insight: {
      eyebrow: "Pattern",
      title: `The ${better} box is the launchpad.`,
      body: `${betterPct}% of serve points won from the ${better} box against ${worsePct}% from the ${worse} — worth choosing sides on the big points.`,
    },
  }
}

function shotMixPattern(d: PlayerData): PatternCandidate | null {
  const dec = d.decisive
  if (!dec) return null
  const mix = [
    { name: "drive", plural: "drives", count: dec.winning_drive },
    { name: "drop", plural: "drops", count: dec.winning_drop },
    { name: "boast", plural: "boasts", count: dec.winning_boast },
  ].sort((a, b) => b.count - a.count)
  const total = mix[0].count + mix[1].count + mix[2].count
  if (total < MIN_DECISIVE_FOR_MIX) return null
  const share = pct(mix[0].count, total)
  if (share < 45) return null
  return {
    root: null,
    salience: share - 33, // distance above an even three-way split
    insight: {
      eyebrow: "Pattern",
      title: `The ${mix[0].name} does the killing.`,
      body: `${mix[0].count} of ${total} decisive shots are ${mix[0].plural} — against ${mix[1].count} ${mix[1].plural} and ${mix[2].count} ${mix[2].plural}. Opponents know what's coming and it lands anyway.`,
    },
  }
}

function phaseSwingPattern(d: PlayerData): PatternCandidate | null {
  const m = d.momentum
  if (
    !m ||
    m.early_rallies < MIN_RALLIES_FOR_RATE ||
    m.close_rallies < MIN_RALLIES_FOR_RATE
  ) {
    return null
  }
  const early = pct(m.early_wins, m.early_rallies)
  const close = pct(m.close_wins, m.close_rallies)
  const gap = close - early
  if (Math.abs(gap) < 8) return null
  return {
    root: "clu",
    salience: Math.abs(gap),
    insight:
      gap > 0
        ? {
            eyebrow: "Pattern",
            title: "The tighter it gets, the better it goes.",
            body: `${early}% of points won early in a game against ${close}% from 9–all — a ${gap}-point climb as the game closes out.`,
          }
        : {
            eyebrow: "Pattern",
            title: "Strong early, leakier late.",
            body: `${early}% of points won early in a game slides to ${close}% from 9–all — a ${-gap}-point drop as the finish line nears.`,
          },
  }
}

/** Always renders: the shape of the average rally, the one read available
 *  from the first logged game. */
function fallbackPattern(d: PlayerData): ProfileInsight {
  const trait = playerTrait(d)
  const avg = d.rally?.avg_length
  // the copy keys off the trait's tempo row — the agency column has its own
  // reads elsewhere, and this fallback is about the shape of the rally
  switch (trait === null ? null : TRAIT_META[trait].tempo) {
    case "long":
      return {
        eyebrow: "Pattern",
        title: "Built for the long game.",
        body: `Rallies average ${avg?.toFixed(1)} shots and the longest ran ${d.rally?.longest} — this game leans on patience.`,
      }
    case "short":
      return {
        eyebrow: "Pattern",
        title: "The rallies stay short.",
        body: `An average rally runs ${avg?.toFixed(1)} shots — the point tends to be decided early, one way or the other.`,
      }
    case "all":
      return {
        eyebrow: "Pattern",
        title: "No single habit dominates.",
        body: `Rallies average ${avg?.toFixed(1)} shots — neither blitz nor grind. The game adapts to the day.`,
      }
    default:
      return {
        eyebrow: "Pattern",
        title: "Patterns take a little longer.",
        body: "Box splits, shot mixes, and phase swings will surface here as more rallies are tagged.",
      }
  }
}

function pickPattern(d: PlayerData, taken: Set<AttributeKey>): ProfileInsight {
  const candidates = [boxGapPattern(d), shotMixPattern(d), phaseSwingPattern(d)]
    .filter((c): c is PatternCandidate => c !== null)
    .filter((c) => c.root === null || !taken.has(c.root))
    .sort((a, b) => b.salience - a.salience)
  return candidates[0]?.insight ?? fallbackPattern(d)
}

export function computeProfileShape(data: PlayerData): ShapeInsights {
  // pair each rated attribute with its narrowed value so the comparisons
  // below stay assertion-free
  const rated = computePlayerAttributes(data).flatMap((a) =>
    a.value === null ? [] : [{ a, value: a.value }]
  )

  // ties break toward card order (computePlayerAttributes returns META
  // order), so the picks are stable across visits
  let strengthAttr: PlayerAttribute | null = null
  let strengthValue = -1
  let weaknessAttr: PlayerAttribute | null = null
  let weaknessValue = 101
  for (const { a, value } of rated) {
    if (value > strengthValue) {
      strengthAttr = a
      strengthValue = value
    }
  }
  for (const { a, value } of rated) {
    if (a === strengthAttr) continue
    if (value < weaknessValue) {
      weaknessAttr = a
      weaknessValue = value
    }
  }

  const strength = strengthAttr
    ? ATTRIBUTE_COPY[strengthAttr.key].strength(strengthAttr, data)
    : STRENGTH_FALLBACK
  const weakness = weaknessAttr
    ? ATTRIBUTE_COPY[weaknessAttr.key].weakness(weaknessAttr, data)
    : WEAKNESS_FALLBACK

  const taken = new Set<AttributeKey>()
  if (strengthAttr) taken.add(strengthAttr.key)
  if (weaknessAttr) taken.add(weaknessAttr.key)
  const pattern = pickPattern(data, taken)

  const name = (key: AttributeKey) =>
    ATTRIBUTE_META.find((m) => m.key === key)!.name.toLowerCase()
  const lede =
    strengthAttr && weaknessAttr
      ? `${SHAPE_LEDE_BASE} Strongest at ${name(strengthAttr.key)}, with ${name(weaknessAttr.key)} the clearest area to improve.`
      : `${SHAPE_LEDE_BASE} The picture sharpens as more rallies are logged.`

  return { lede, insights: [strength, weakness, pattern] }
}
