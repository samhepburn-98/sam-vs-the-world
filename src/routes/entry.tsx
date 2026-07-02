import { createFileRoute, redirect } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

export const Route = createFileRoute("/entry")({
  // UX gate only — RLS is the real lock (§8.5)
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/login" })
  },
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
