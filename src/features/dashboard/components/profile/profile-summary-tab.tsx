import { AttributeRadar } from "@/features/dashboard/components/shared/attribute-radar"
import { ErrorWall } from "@/features/dashboard/components/profile/error-wall"
import { NarrativeInsight } from "@/features/dashboard/components/profile/narrative-insight"
import {
  PROFILE_PANEL,
  ProfileSection,
} from "@/features/dashboard/components/shared/profile-section"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"
import type { ErrorsInsights } from "@/features/dashboard/lib/profile-errors"
import type { ProfileInsight } from "@/features/dashboard/lib/profile-types"
import type { ShapeInsights } from "@/features/dashboard/lib/profile-shape"

// The Summary tab: the story of the player, told visual-first. Each section
// is one panel pairing a graphic with the narrative insights it supports —
// the radar with the strength/weakness/pattern read (computeProfileShape),
// the error wall with the biggest-leak read (computeProfileErrors). The
// Stats tab holds the dense grid; the Matches tab holds the history.

function InsightColumn({ insights }: { insights: Array<ProfileInsight> }) {
  return (
    <div className="flex flex-col gap-4">
      {insights.map((insight) => (
        <NarrativeInsight key={insight.eyebrow} insight={insight} />
      ))}
    </div>
  )
}

export function ProfileSummaryTab({
  name,
  attrs,
  shape,
  errors,
}: {
  name: string
  attrs: Array<PlayerAttribute>
  shape: ShapeInsights
  errors: ErrorsInsights
}) {
  return (
    <div className="flex flex-col gap-10">
      <ProfileSection title="The shape of the game" lede={shape.lede}>
        <div className={`${PROFILE_PANEL} grid gap-4 lg:grid-cols-[1.2fr_1fr]`}>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-sm">
              <AttributeRadar attrs={attrs} side="p1" name={name} />
            </div>
          </div>
          <InsightColumn insights={shape.insights} />
        </div>
      </ProfileSection>

      <ProfileSection title="Where the errors die" lede={errors.lede}>
        <div className={`${PROFILE_PANEL} grid gap-4 lg:grid-cols-[1.4fr_1fr]`}>
          <div className="flex items-center justify-center">
            <ErrorWall wall={errors.wall} />
          </div>
          <InsightColumn insights={errors.insights} />
        </div>
      </ProfileSection>
    </div>
  )
}
