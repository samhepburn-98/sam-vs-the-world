import { PlayerMatchHistory } from "@/features/dashboard/components/player-match-history"
import {
  PROFILE_PANEL,
  ProfileSection,
} from "@/features/dashboard/components/profile-section"

// The Matches tab: the player's full history, one match per row with its
// per-game scores — promoted to its own tab so the Summary stays a story
// and the season's record gets room to grow.

export function ProfileMatchesTab({ playerId }: { playerId: string }) {
  return (
    <div className="flex flex-col gap-10">
      <ProfileSection
        title="Match history"
        lede="Most recent first, every game score alongside. Each row will open the full rally-by-rally log."
      >
        <div className={PROFILE_PANEL}>
          <PlayerMatchHistory playerId={playerId} />
        </div>
      </ProfileSection>
    </div>
  )
}
