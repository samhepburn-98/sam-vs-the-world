import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { PageStub } from "@/components/page-stub"

// The full page lands in #29; the `rally` deep-link param is validated here
// now so category-page drills (#28) compile and land on the right match.
const matchSearch = z.object({
  rally: z.number().int().optional().catch(undefined),
})

export const Route = createFileRoute("/matches/$matchId")({
  validateSearch: (search) => matchSearch.parse(search),
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
