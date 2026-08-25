import { Link } from "@tanstack/react-router"

import { usePlayerInsights } from "@/features/dashboard/api/use-player-insights"
import { PlayerCard } from "@/features/dashboard/components/player-card"
import {
  computePlayerAttributes,
  heroStat,
  playerTrait,
} from "@/features/dashboard/lib/player-attributes"

import type { PlayerSummary } from "@/lib/schemas/player"

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
// raised in the stacking order so neighbours can't crop the glow. The glow is
// a pre-rendered sprite (the frame silhouette, tinted and blurred, baked by
// scripts/generate-card-glow.mjs) rather than a runtime drop-shadow filter:
// engines disagree wildly on filter spread, WebKit clips the filter region,
// and transitioning a filter re-rasterizes every frame. A sprite renders
// identically everywhere, and only compositor-friendly properties animate —
// transform for the lift, opacity for the fade.

const GLOW_SPRITES: Record<"p1" | "p2", string> = {
  p1: "/card-glow-p1.webp",
  p2: "/card-glow-p2.webp",
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
      className="group relative block outline-none hover:z-10 focus-visible:z-10"
    >
      <div className="relative isolate transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
        {/* sprite geometry: the baked padding is 20% of the frame width per
            side and 12.53% of its height, so those insets land the shield in
            the sprite exactly over the card */}
        <img
          src={GLOW_SPRITES[side]}
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-[-12.53%] left-[-20%] -z-10 h-[125.06%] w-[140%] max-w-none opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
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
