import { AttributeRadar } from "@/features/dashboard/components/attribute-radar"
import { ErrorWall } from "@/features/dashboard/components/error-wall"
import { MatchHistory } from "@/features/dashboard/components/match-history"
import { NarrativeInsight } from "@/features/dashboard/components/narrative-insight"
import { SeasonStrip } from "@/features/dashboard/components/season-strip"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"
import type {
  ProfileFixture,
  ProfileInsight,
} from "@/features/dashboard/lib/profile-fixture"
import type { ShapeInsights } from "@/features/dashboard/lib/profile-shape"
import type { ReactNode } from "react"

// The Summary tab: the story of the player, told visual-first. Each section
// pairs one graphic with the narrative insights it supports — the radar with
// the strength/weakness/pattern read (real, via computeProfileShape), the
// error wall with the tin tax, then the season strip and the match history
// table. The Stats tab holds the dense grid. Everything below the shape
// section still renders PROFILE_FIXTURE until its wiring lands.

function Section({
  title,
  lede,
  children,
}: {
  title: string
  lede: string
  children: ReactNode
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div>
        <h2 className="text-xs font-semibold tracking-widest text-primary uppercase">
          {title}
        </h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{lede}</p>
      </div>
      {children}
    </section>
  )
}

function InsightColumn({ insights }: { insights: Array<ProfileInsight> }) {
  return (
    <div className="flex flex-col gap-4">
      {insights.map((insight) => (
        <NarrativeInsight key={insight.eyebrow} insight={insight} />
      ))}
    </div>
  )
}

const PANEL =
  "bg-card text-card-foreground ring-foreground/10 rounded-2xl p-5 ring-1"

export function ProfileSummaryTab({
  name,
  attrs,
  shape,
  profile,
}: {
  name: string
  attrs: Array<PlayerAttribute>
  shape: ShapeInsights
  profile: ProfileFixture
}) {
  return (
    <div className="flex flex-col gap-10">
      <Section title="The shape of the game" lede={shape.lede}>
        <div className={`${PANEL} grid gap-4 lg:grid-cols-[1.2fr_1fr]`}>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm">
              <AttributeRadar attrs={attrs} side="p1" name={name} />
            </div>
          </div>
          <InsightColumn insights={shape.insights} />
        </div>
      </Section>

      <Section title="Where the errors die" lede={profile.errors.lede}>
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className={PANEL}>
            <ErrorWall wall={profile.errors.wall} />
          </div>
          <InsightColumn insights={profile.errors.insights} />
        </div>
      </Section>

      <Section
        title="The season, one game at a time"
        lede={profile.season.lede}
      >
        <div className={PANEL}>
          <SeasonStrip games={profile.season.games} />
        </div>
      </Section>

      <Section title="Match history" lede={profile.history.lede}>
        <div className={PANEL}>
          <MatchHistory matches={profile.history.matches} />
          <p className="mt-4 text-xs text-muted-foreground/70">
            {profile.history.foldNote}
          </p>
        </div>
      </Section>
    </div>
  )
}
