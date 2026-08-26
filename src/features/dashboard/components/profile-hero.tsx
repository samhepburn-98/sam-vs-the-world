import { Link } from "@tanstack/react-router"

import { PlayerCard } from "@/features/dashboard/components/player-card"
import { TRAIT_LABELS } from "@/features/dashboard/lib/player-attributes"
import { PageTitle } from "@/components/typography"
import { StatTile } from "@/components/stat-tile"
import { TraitChip } from "@/components/trait-chip"

import type { ProfileHeaderData } from "@/features/dashboard/lib/profile-header"

// The profile header: the card is the identity anchor on the left, the
// right column carries the name, the earned trait chip, the signature read,
// and six KPI tiles — the whole player at a glance before the tabs split
// into story and detail. Presentational only; computeProfileHeader decides
// every value it's handed.

export function ProfileHero({ header }: { header: ProfileHeaderData }) {
  return (
    <header className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="w-48 shrink-0 sm:w-52">
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

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <PageTitle>{header.name}</PageTitle>
            {header.trait && (
              <TraitChip>{TRAIT_LABELS[header.trait]}</TraitChip>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {header.signature ? (
              <>
                <span className="font-medium text-foreground">
                  {header.signature}
                </span>{" "}
                {header.meta} ·{" "}
                <Link
                  to="/traits"
                  className="underline-offset-2 hover:text-foreground hover:underline"
                >
                  Traits explained
                </Link>
              </>
            ) : (
              header.meta
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {header.kpis.map((kpi) => (
            <StatTile
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              detail={kpi.detail}
              accent={kpi.accent}
            />
          ))}
        </div>
      </div>
    </header>
  )
}
