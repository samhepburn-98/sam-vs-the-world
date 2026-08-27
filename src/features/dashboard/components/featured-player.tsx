import { Link } from "@tanstack/react-router"

import { usePlayerInsights } from "@/features/dashboard/api/use-player-insights"
import { PlayerCard } from "@/features/dashboard/components/player-card"
import { headerSignature } from "@/features/dashboard/lib/profile-header"
import {
  computePlayerAttributes,
  heroStat,
  playerTrait,
} from "@/features/dashboard/lib/player-attributes"
import { Callout } from "@/components/broadcast/callout"

import type { PlayerSummary } from "@/lib/schemas/player"

// The featured slot: the protagonist's full card with the pundit callouts
// beside it — the read (their signature receipt) and the form line. The
// card is a link to the profile; the callouts speak in the broadcast
// accent-bar voice.

export function FeaturedPlayer({ player }: { player: PlayerSummary }) {
  const data = usePlayerInsights(player.id)

  const read = headerSignature(data)
  const h = data.headline
  const m = data.momentum
  const formParts = [
    h && h.matches_decided > 0
      ? `${h.matches_won}–${h.matches_decided - h.matches_won} in decided matches`
      : null,
    m && m.longest_streak > 0 ? `best streak ${m.longest_streak} points` : null,
  ].filter(Boolean)

  return (
    <div className="flex items-center gap-5">
      <Link
        to="/players/$playerId"
        params={{ playerId: player.id }}
        aria-label={`${player.name} — view profile`}
        className="block w-44 shrink-0 transition-transform duration-300 ease-out hover:-translate-y-1 motion-reduce:hover:translate-y-0 sm:w-48"
      >
        <PlayerCard
          name={player.name}
          side="p1"
          avatarSrc={player.avatar_url ?? "/avatars/default.svg"}
          trait={playerTrait(data)}
          handedness={player.handedness}
          hero={heroStat(data)}
          attrs={computePlayerAttributes(data)}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {read && (
          <Callout side="p1" label="The read">
            {read}
          </Callout>
        )}
        {formParts.length > 0 && (
          <Callout side="neutral" label="Form">
            {formParts.join(" · ")}.
          </Callout>
        )}
      </div>
    </div>
  )
}
