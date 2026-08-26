import { Link } from "@tanstack/react-router"

import { PlayerCard } from "@/features/dashboard/components/player-card"
import { TRAIT_LABELS } from "@/features/dashboard/lib/player-attributes"
import { PageTitle } from "@/components/typography"
import { StatRow } from "@/components/stat-row"
import { TraitChip } from "@/components/trait-chip"

import type { ProfileHeaderData } from "@/features/dashboard/lib/profile-header"

// The profile header as a broadcast graphic: the card anchors the left, the
// right column runs name → trait line → the receipt → the stat rows, like a
// player lower-third expanded to a panel. Presentational only;
// computeProfileHeader decides every value it's handed.

export function ProfileHero({ header }: { header: ProfileHeaderData }) {
  return (
    <header className="flex items-center gap-4 sm:gap-6">
      <div className="w-36 shrink-0 sm:w-48">
        <PlayerCard
          name={header.name}
          side="p1"
          avatarSrc={header.avatarSrc}
          trait={header.trait}
          handedness={header.handedness}
          hero={header.hero}
          attrs={header.attrs}
          statTooltips
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <PageTitle>{header.name}</PageTitle>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {header.trait && (
              <TraitChip tone="p1">{TRAIT_LABELS[header.trait]}</TraitChip>
            )}
            <span className="font-heading text-[13px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              {header.meta}
            </span>
          </p>
          {header.signature && (
            <p className="text-xs text-muted-foreground">
              {header.signature} ·{" "}
              <Link
                to="/traits"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                Traits explained
              </Link>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {header.kpis.map((kpi) => (
            <StatRow
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              detail={kpi.detail || undefined}
            />
          ))}
        </div>
      </div>
    </header>
  )
}
