import { Link } from "@tanstack/react-router"

import { usePlayerInsights } from "@/features/dashboard/api/use-player-insights"
import { FRAMES, PlayerCard } from "@/features/dashboard/components/player-card"
import {
  computePlayerAttributes,
  heroStat,
  playerTrait,
} from "@/features/dashboard/lib/player-attributes"

import type { PlayerSummary } from "@/lib/schemas/player"
import type { CSSProperties } from "react"

// The roster card is the full FUT player card, made into a link to the
// player's page. Identity — frame, photo, name, handedness — comes straight
// from the players list, so it's in the server-rendered markup; the six
// attributes, win rate, and trait are computed from the same insight payloads
// the compare and profile pages use (warmed in the home loader). The frame PNG
// fixes the card's height, so those numbers fill in without shifting anything.
//
// Hover/focus lifts the card with a glow behind it, tinted to the frame. The
// link (the hover target) stays put — the inner div moves — so the card can't
// slide out from under the cursor at the edges, and the hovered link is
// raised in the stacking order so neighbours can't crop the glow. The glow
// must follow the shield's alpha, but transitioning a drop-shadow filter
// re-rasterizes it every frame (janky, worst in WebKit) and browsers clip
// the animating filter's region. So the glow is its own layer — a copy of
// the frame PNG with a static drop-shadow — and only compositor-friendly
// properties animate: transform for the lift, opacity for the fade.

const GLOW: Record<"p1" | "p2", string> = {
  p1: "rgba(224, 120, 66, 0.6)",
  p2: "rgba(92, 142, 232, 0.6)",
}

export function RosterCard({
  player,
  side,
}: {
  player: PlayerSummary
  side: "p1" | "p2"
}) {
  const data = usePlayerInsights(player.id)

  return (
    <Link
      to="/players/$playerId"
      params={{ playerId: player.id }}
      aria-label={`${player.name} — view profile`}
      style={{ "--glow": GLOW[side] } as CSSProperties}
      className="group relative block outline-none hover:z-10 focus-visible:z-10"
    >
      <div className="relative isolate transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
        <img
          src={FRAMES[side]}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0 transition-opacity duration-300 ease-out [filter:drop-shadow(0_0_1.25rem_var(--glow))] group-hover:opacity-100 group-focus-visible:opacity-100"
        />
        <PlayerCard
          name={player.name}
          side={side}
          avatarSrc={player.avatar_url ?? "/avatars/default.svg"}
          trait={playerTrait(data)}
          handedness={player.handedness}
          hero={heroStat(data)}
          attrs={computePlayerAttributes(data)}
        />
      </div>
    </Link>
  )
}
