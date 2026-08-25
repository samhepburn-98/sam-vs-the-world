import { Link } from "@tanstack/react-router"

import { PlayerCard } from "@/features/dashboard/components/player-card"
import { PageTitle } from "@/components/typography"
import { cn } from "@/lib/utils"

import type { ProfileKpi } from "@/features/dashboard/lib/profile-types"
import type { ProfileHeaderData } from "@/features/dashboard/lib/profile-header"

// The profile header: the card is the identity anchor on the left, the
// right column carries the name, the signature read, and six KPI tiles —
// the whole player at a glance before the tabs split into story and detail.
// Presentational only; computeProfileHeader decides every value it's handed.

function KpiTile({ kpi }: { kpi: ProfileKpi }) {
  return (
    <div className="rounded-xl bg-card p-3 text-card-foreground ring-1 ring-foreground/10">
      <p
        className={cn(
          "text-2xl font-bold tabular-nums",
          kpi.accent && "text-primary"
        )}
      >
        {kpi.value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        {kpi.label}
      </p>
      {kpi.detail && (
        <p className="text-xs text-muted-foreground/70 tabular-nums">
          {kpi.detail}
        </p>
      )}
    </div>
  )
}

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
          <PageTitle>{header.name}</PageTitle>
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
            <KpiTile key={kpi.label} kpi={kpi} />
          ))}
        </div>
      </div>
    </header>
  )
}
