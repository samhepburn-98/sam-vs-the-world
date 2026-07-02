import { createFileRoute } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

// Auth guard (beforeLoad → /login) lands with #12 in phase 2.
export const Route = createFileRoute("/entry")({
  component: EntryPage,
})

function EntryPage() {
  return (
    <PageStub
      title="Rally logger"
      description="The entry portal — score header, winner buttons, and outcome chips land in phase 2."
    />
  )
}
