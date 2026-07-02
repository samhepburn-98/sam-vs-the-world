import { createFileRoute } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

export const Route = createFileRoute("/players/$playerId/$category")({
  component: CategoryDetailPage,
})

function CategoryDetailPage() {
  const { category } = Route.useParams()
  return (
    <PageStub
      title={`Insight: ${category}`}
      description="The full category breakdown with drill-through lands in phase 6."
    />
  )
}
