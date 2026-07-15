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
      className="block rounded-[8%] outline-none transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <PlayerCard
        name={player.name}
        side={side}
        avatarSrc={player.avatar_url ?? "/avatars/default.svg"}
        trait={playerTrait(data)}
        handedness={player.handedness}
        hero={heroStat(data)}
        attrs={computePlayerAttributes(data)}
      />
    </Link>
  )
}
