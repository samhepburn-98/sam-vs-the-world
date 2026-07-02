import { createFileRoute } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

export const Route = createFileRoute("/matches/")({
  component: MatchesPage,
})

function MatchesPage() {
  return (
    <PageStub
      title="Match history"
      description="Every match, newest first, lands in phase 6."
    />
  )
}
