import { createFileRoute } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

export const Route = createFileRoute("/manage")({
  component: ManagePage,
})

function ManagePage() {
  return (
    <PageStub
      title="Manage"
      description="The raw data browser and edit surface lands in phase 4."
    />
  )
}
