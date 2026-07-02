import { createFileRoute } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

export const Route = createFileRoute("/compare")({
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
