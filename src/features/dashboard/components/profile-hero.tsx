import { PlayerCard } from "@/features/dashboard/components/player-card"
import { TRAIT_LABELS } from "@/features/dashboard/lib/player-attributes"
import { cn } from "@/lib/utils"

import type {
  ProfileFixture,
  ProfileKpi,
} from "@/features/dashboard/lib/profile-fixture"

// The profile header: the card is the identity anchor on the left, the
// right column carries the name, the signature read, and six KPI tiles —
// the whole player at a glance before the tabs split into story and detail.

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
      <p className="text-xs text-muted-foreground/70 tabular-nums">
        {kpi.detail}
      </p>
    </div>
  )
}

export function ProfileHero({
  profile,
  avatarSrc,
}: {
  profile: ProfileFixture
  avatarSrc: string
}) {
  return (
    <header className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="w-48 shrink-0 sm:w-52">
        <PlayerCard
          name={profile.name}
          side="p1"
          avatarSrc={avatarSrc}
          trait={profile.trait}
          handedness={profile.handedness}
          hero={profile.card.hero}
          attrs={profile.card.attrs}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              {profile.name}
            </h1>
            <span className="text-sm font-semibold tracking-widest text-primary uppercase">
              {TRAIT_LABELS[profile.trait]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {profile.signature}
            </span>{" "}
            {profile.meta}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {profile.kpis.map((kpi) => (
            <KpiTile key={kpi.label} kpi={kpi} />
          ))}
        </div>
      </div>
    </header>
  )
}
