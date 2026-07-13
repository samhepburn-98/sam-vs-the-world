import {
  computePlayerAttributes,
  heroStat,
  playerTrait,
  signatureLine,
} from "@/features/dashboard/lib/player-attributes"

import type {
  PlayerAttribute,
  PlayerData,
} from "@/features/dashboard/lib/player-attributes"
import type { ProfileKpi } from "@/features/dashboard/lib/profile-types"
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

/** The six KPI tiles — counting stats and records that complement the card,
 *  never a rate the card already shows (win rate is the card's hero, the six
 *  attributes its grid). Each is honest about its own sample: a tile with no
 *  payload yet shows a dash. Records and counts show from the first game —
 *  they're not rates, so there's no small-sample lie to guard against. */
function buildKpis(data: PlayerData): Array<ProfileKpi> {
  const { headline: h, rally: r, momentum: m, serve: s } = data

  const matches: ProfileKpi = {
    value:
      h && h.matches_decided > 0
        ? `${h.matches_won}–${h.matches_decided - h.matches_won}`
        : DASH,
    label: "Matches",
    detail: h && h.matches_decided > 0 ? `${h.matches_decided} decided` : "",
  }

  const games: ProfileKpi = {
    value:
      h && h.games_decided > 0
        ? `${h.games_won}–${h.games_decided - h.games_won}`
        : DASH,
    label: "Games",
    detail: h && h.games_decided > 0 ? `${h.games_decided} decided` : "",
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

  const aces: ProfileKpi = {
    value: s ? String(s.aces) : DASH,
    label: "Aces",
    detail: s ? `${s.double_faults} double faults` : "",
  }

  return [matches, games, avgRally, streak, comebacks, aces]
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
