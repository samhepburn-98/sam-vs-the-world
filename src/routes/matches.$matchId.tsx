import { createFileRoute } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

export const Route = createFileRoute("/matches/$matchId")({
  component: MatchDetailPage,
})

function MatchDetailPage() {
  return (
    <PageStub
      title="Match detail"
      description="Game strip, rally timeline, and momentum land in phase 6."
    />
  )
}
