import {
  computePlayerAttributes,
  heroStat,
  playerTrait,
  signatureLine,
} from "@/features/dashboard/lib/player-attributes"
import {
  MIN_ERRORS_FOR_RATE,
  MIN_GAMES_FOR_WIN_RATE,
} from "@/features/dashboard/utils/insight-thresholds"

import type {
  PlayerAttribute,
  PlayerData,
} from "@/features/dashboard/lib/player-attributes"
import type { ProfileKpi } from "@/features/dashboard/lib/profile-fixture"
import type { SignatureTrait } from "@/features/dashboard/schemas/insights"
import type { Handedness } from "@/lib/schemas/enums"
import type { PlayerSummary } from "@/lib/schemas/player"

// Maps a player's identity + the five insight payloads onto the profile
// header. This is the seam between real data and the presentational
// ProfileHero: everything honest (dashes under sample) is decided here so the
// component just lays out what it's handed. The same six-attribute model
// feeds the card grid and radar via computePlayerAttributes, so the header
// can't disagree with the tabs about who this player is.

export interface ProfileHeaderData {
  name: string
  handedness: Handedness | null
  trait: SignatureTrait | null
  /** The one-line read under the name, trait prefix stripped (the chip
   *  already carries it). Null when the trait can't be called yet. */
  signature: string | null
  /** "Right-handed · 40 games across 12 matches" — identity, not a rate. */
  meta: string
  avatarSrc: string
  hero: { display: string; label: string }
  attrs: Array<PlayerAttribute>
  kpis: Array<ProfileKpi>
}

const DASH = "—"

function handednessLabel(h: Handedness | null): string | null {
  if (!h) return null
  return h === "left" ? "Left-handed" : "Right-handed"
}

/** signatureLine with the "Trait — " prefix removed and the remainder
 *  sentence-cased, since the header shows the trait as its own chip. Driven by
 *  the same resolved trait as that chip (playerTrait's avg-length fallback
 *  included), so the two never disagree. */
function headerSignature(data: PlayerData): string | null {
  const trait = playerTrait(data)
  if (!trait || !data.rally) return null
  const full = signatureLine({ signature_trait: trait }, data.rally)
  if (!full) return null
  const body = full.replace(/^.*?—\s*/, "")
  return body.charAt(0).toUpperCase() + body.slice(1)
}

function buildMeta(handedness: Handedness | null, data: PlayerData): string {
  const segments: Array<string> = []
  const hand = handednessLabel(handedness)
  if (hand) segments.push(hand)

  const h = data.headline
  if (h && h.games_decided > 0) {
    segments.push(
      h.matches_decided > 0
        ? `${h.games_decided} games across ${h.matches_decided} matches`
        : `${h.games_decided} games`
    )
  }
  return segments.join(" · ")
}

function pct(won: number, of: number): number {
  return Math.round((won / of) * 100)
}

/** The six KPI tiles, each honest about its own sample. A tile with no data
 *  yet shows a dash rather than a zero or a misleading rate. */
function buildKpis(data: PlayerData): Array<ProfileKpi> {
  const { headline: h, rally: r, error: e, momentum: m } = data

  const winRate: ProfileKpi = {
    value:
      h && h.games_decided >= MIN_GAMES_FOR_WIN_RATE
        ? `${pct(h.games_won, h.games_decided)}%`
        : DASH,
    label: "Win rate",
    detail: h ? `${h.games_won}–${h.games_decided - h.games_won} games` : "",
    accent: true,
  }

  const matches: ProfileKpi = {
    value:
      h && h.matches_decided > 0
        ? `${h.matches_won}–${h.matches_decided - h.matches_won}`
        : DASH,
    label: "Matches",
    detail: h && h.matches_decided > 0 ? `${h.matches_decided} decided` : "",
  }

  const avgRally: ProfileKpi = {
    value: r && r.avg_length != null ? r.avg_length.toFixed(1) : DASH,
    label: "Avg rally",
    detail: r && r.longest > 0 ? `longest ${r.longest}` : "",
  }

  const streak: ProfileKpi = {
    value: m ? String(m.longest_streak) : DASH,
    label: "Best streak",
    detail: "points in a row",
  }

  const comebacks: ProfileKpi = {
    value: m ? String(m.comebacks) : DASH,
    label: "Comebacks",
    detail: "games won from behind",
  }

  const tagged = e ? e.forced_errors + e.unforced_errors : 0
  const errorsForced: ProfileKpi = {
    value:
      e && tagged >= MIN_ERRORS_FOR_RATE
        ? `${pct(e.forced_errors, tagged)}%`
        : DASH,
    label: "Errors forced",
    detail: e && tagged > 0 ? `${e.forced_errors} of ${tagged} tagged` : "",
  }

  return [winRate, matches, avgRally, streak, comebacks, errorsForced]
}

export function computeProfileHeader(
  player: PlayerSummary,
  data: PlayerData
): ProfileHeaderData {
  return {
    name: player.name,
    handedness: player.handedness,
    trait: playerTrait(data),
    signature: headerSignature(data),
    meta: buildMeta(player.handedness, data),
    avatarSrc: player.avatar_url ?? "/avatars/default.svg",
    hero: heroStat(data),
    attrs: computePlayerAttributes(data),
    kpis: buildKpis(data),
  }
}
