import { createFileRoute } from "@tanstack/react-router"

import { ProfileHero } from "@/features/dashboard/components/profile-hero"
import { ProfileStatsTab } from "@/features/dashboard/components/profile-stats-tab"
import { ProfileSummaryTab } from "@/features/dashboard/components/profile-summary-tab"
import { PROFILE_FIXTURE } from "@/features/dashboard/lib/profile-fixture"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// The redesigned player profile: card-anchored hero with the KPI row, then
// two tabs — Summary tells the story (radar, error wall, season strip,
// timeline), Stats is the dense bento for scanning before a match.
//
// STRUCTURE PASS: the page renders PROFILE_FIXTURE for every playerId — no
// loaders, no queries — so the layout can be judged on its own. Wiring the
// insight RPCs back in replaces the fixture, not the components.

export const Route = createFileRoute("/players/$playerId/")({
  component: PlayerProfilePage,
})

function PlayerProfilePage() {
  const profile = PROFILE_FIXTURE

  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <ProfileHero profile={profile} avatarSrc="/avatars/default.svg" />

      <Tabs defaultValue="summary">
        <TabsList variant="line" aria-label="Profile sections">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="pt-4">
          <ProfileSummaryTab profile={profile} />
        </TabsContent>
        <TabsContent value="stats" className="pt-4">
          <ProfileStatsTab profile={profile} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
