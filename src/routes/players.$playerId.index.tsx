import { createFileRoute } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

export const Route = createFileRoute("/players/$playerId/")({
  component: PlayerOverviewPage,
})

function PlayerOverviewPage() {
  return (
    <PageStub
      title="Player overview"
      description="Win rate, record, and five insight categories land in phase 6."
    />
  )
}
