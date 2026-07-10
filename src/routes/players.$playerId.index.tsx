import { createFileRoute } from "@tanstack/react-router"

import { decisiveShotsOptions } from "@/features/dashboard/api/get-decisive-shots"
import { errorProfileOptions } from "@/features/dashboard/api/get-error-profile"
import { momentumOptions } from "@/features/dashboard/api/get-momentum"
import { playerHeadlineOptions } from "@/features/dashboard/api/get-player-headline"
import { rallyLengthsOptions } from "@/features/dashboard/api/get-rally-lengths"
import { serveStatsOptions } from "@/features/dashboard/api/get-serve-stats"
import { usePlayerInsights } from "@/features/dashboard/api/use-player-insights"
import { ProfileHero } from "@/features/dashboard/components/profile-hero"
import { ProfileStatsTab } from "@/features/dashboard/components/profile-stats-tab"
import { ProfileSummaryTab } from "@/features/dashboard/components/profile-summary-tab"
import { computeProfileHeader } from "@/features/dashboard/lib/profile-header"
import { computeProfileStats } from "@/features/dashboard/lib/profile-stats"
import { PROFILE_FIXTURE } from "@/features/dashboard/lib/profile-fixture"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

// The redesigned player profile: card-anchored hero with the KPI row, then
// two tabs — Summary tells the story (radar, error wall, season strip,
// match history), Stats is the dense bento for scanning before a match.
//
// WIRING IN PROGRESS. The header and the Stats tab's four RPC-backed cards
// (rally curve, phase win rates, serve, errors given) read real data; the
// Summary tab and the remaining Stats cards (point-enders, head-to-head,
// recent, season) still render PROFILE_FIXTURE, wired one at a time.

export const Route = createFileRoute("/players/$playerId/")({
  loader: async ({ context, params }) => {
    const id = params.playerId
    await Promise.all([
      context.queryClient.ensureQueryData(playerHeadlineOptions(id, {})),
      context.queryClient.ensureQueryData(serveStatsOptions(id, {})),
      context.queryClient.ensureQueryData(errorProfileOptions(id, {})),
      context.queryClient.ensureQueryData(rallyLengthsOptions(id, {})),
      context.queryClient.ensureQueryData(momentumOptions(id, {})),
      context.queryClient.ensureQueryData(decisiveShotsOptions(id, {})),
      context.queryClient.ensureQueryData(playersQueryOptions()),
    ])
  },
  component: PlayerProfilePage,
})

function PlayerProfilePage() {
  const { playerId } = Route.useParams()
  const data = usePlayerInsights(playerId, {})
  const players = usePlayers()
  const player = players.data?.find((p) => p.id === playerId)

  if (!player) {
    return (
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-52 w-full rounded-2xl" />
      </main>
    )
  }

  const header = computeProfileHeader(player, data)
  const stats = computeProfileStats(data)
  // Summary tab + the not-yet-wired Stats cards still read the fixture.
  const profile = PROFILE_FIXTURE

  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <ProfileHero header={header} />

      <Tabs defaultValue="summary">
        <TabsList variant="line" aria-label="Profile sections">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="pt-4">
          <ProfileSummaryTab profile={profile} />
        </TabsContent>
        <TabsContent value="stats" className="pt-4">
          <ProfileStatsTab stats={stats} fixture={profile} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
