import { Link } from "@tanstack/react-router"

import { usePlayerInsights } from "@/features/dashboard/api/use-player-insights"
import {
  TRAIT_LABELS,
  heroStat,
  playerTrait,
} from "@/features/dashboard/lib/player-attributes"
import { FormGuide } from "@/components/broadcast/form-guide"
import { TraitChip } from "@/components/broadcast/trait-chip"
import { cn } from "@/lib/utils"

import type { PlayerSummary } from "@/lib/schemas/player"

// The roster row: one broadcast line per player — accent bar in their side's
// colour, name in the display face, trait tag, recent form, win rate on the
// right. Identity comes from the players list (server-rendered); the trait
// and rate fill in from the same insight payloads every other surface uses.

export function RosterRow({
  player,
  side,
  form,
}: {
  player: PlayerSummary
  side: "p1" | "p2"
  /** Recent results involving this player, oldest first. */
  form: Array<"w" | "l" | "d">
}) {
  const data = usePlayerInsights(player.id)
  const trait = playerTrait(data)
  const hero = heroStat(data)

  return (
    <Link
      to="/players/$playerId"
      params={{ playerId: player.id }}
      aria-label={`${player.name} — view profile`}
      className={cn(
        "flex items-center justify-between gap-3 border-l-4 bg-card px-3.5 py-2.5 transition-colors hover:bg-accent",
        side === "p1" ? "border-primary" : "border-p2"
      )}
    >
      <span className="flex min-w-0 items-baseline gap-2.5">
        <span className="truncate font-heading text-xl leading-none font-extrabold uppercase">
          {player.name}
        </span>
        {trait && (
          <TraitChip tone={side} className="text-xs">
            {TRAIT_LABELS[trait]}
          </TraitChip>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <FormGuide results={form} className="hidden sm:inline-flex" />
        <span
          className="font-heading text-xl font-extrabold tabular-nums"
          aria-label={`${hero.label} ${hero.display}`}
        >
          {hero.display}
        </span>
      </span>
    </Link>
  )
}
