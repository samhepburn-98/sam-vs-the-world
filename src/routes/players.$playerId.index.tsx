import { createFileRoute } from "@tanstack/react-router"

import { decisiveShotsOptions } from "@/features/dashboard/api/get-decisive-shots"
import { errorProfileOptions } from "@/features/dashboard/api/get-error-profile"
import { momentumOptions } from "@/features/dashboard/api/get-momentum"
import { playerHeadlineOptions } from "@/features/dashboard/api/get-player-headline"
import {
  playerH2hQueryOptions,
  usePlayerH2h,
} from "@/features/dashboard/api/get-player-h2h"
import { rallyLengthsOptions } from "@/features/dashboard/api/get-rally-lengths"
import { serveStatsOptions } from "@/features/dashboard/api/get-serve-stats"
import { usePlayerInsights } from "@/features/dashboard/api/use-player-insights"
import { ProfileHero } from "@/features/dashboard/components/profile-hero"
import { ProfileMatchesTab } from "@/features/dashboard/components/profile-matches-tab"
import { ProfileStatsTab } from "@/features/dashboard/components/profile-stats-tab"
import { ProfileSummaryTab } from "@/features/dashboard/components/profile-summary-tab"
import { computeProfileErrors } from "@/features/dashboard/lib/profile-errors"
import { computeH2h } from "@/features/dashboard/lib/profile-h2h"
import { computeProfileHeader } from "@/features/dashboard/lib/profile-header"
import { computeProfileShape } from "@/features/dashboard/lib/profile-shape"
import { computeProfileStats } from "@/features/dashboard/lib/profile-stats"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

// The redesigned player profile: card-anchored hero with the KPI row, then
// three tabs — Summary tells the story (radar, error wall), Stats is the
// dense bento for scanning before a match, Matches is the full history.
// Every card and section reads real data.

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
      context.queryClient.ensureQueryData(playerH2hQueryOptions(id)),
      context.queryClient.ensureQueryData(playersQueryOptions()),
    ])
  },
  component: PlayerProfilePage,
})

function PlayerProfilePage() {
  const { playerId } = Route.useParams()
  const data = usePlayerInsights(playerId, {})
  const players = usePlayers()
  const h2hMatches = usePlayerH2h(playerId)
  const player = players.data?.find((p) => p.id === playerId)

  if (!player) {
    return (
      <main className="container mx-auto max-w-6xl px-4 py-10">
        <Skeleton className="h-52 w-full rounded-2xl" />
      </main>
    )
  }

  const nameOf = (id: string) =>
    players.data?.find((p) => p.id === id)?.name ?? "Unknown"

  const header = computeProfileHeader(player, data)
  const stats = computeProfileStats(data)
  const shape = computeProfileShape(data)
  const errors = computeProfileErrors(data)
  const h2h = computeH2h(playerId, h2hMatches.data ?? [], nameOf)

  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <ProfileHero header={header} />

      <Tabs defaultValue="summary">
        <TabsList aria-label="Profile sections">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="pt-4">
          <ProfileSummaryTab
            name={player.name}
            attrs={header.attrs}
            shape={shape}
            errors={errors}
          />
        </TabsContent>
        <TabsContent value="stats" className="pt-4">
          <ProfileStatsTab stats={stats} h2h={h2h} />
        </TabsContent>
        <TabsContent value="matches" className="pt-4">
          <ProfileMatchesTab playerId={playerId} />
        </TabsContent>
      </Tabs>
    </main>
  )
}
