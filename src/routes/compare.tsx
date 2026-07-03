import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { PageStub } from "@/components/page-stub"

// The comparison itself lands in #30; the search contract is here now so the
// home roster's "Compare" selection has somewhere to land. `players` is a
// comma-separated id list.
const compareSearch = z.object({
  players: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => compareSearch.parse(search),
  component: ComparePage,
})

function ComparePage() {
  return (
    <PageStub
      title="Compare players"
      description="Side-by-side profiles and head-to-head land in phase 6."
    />
  )
}
