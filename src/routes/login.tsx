import { createFileRoute } from "@tanstack/react-router"

import { PageStub } from "@/components/page-stub"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  return (
    <PageStub
      title="Log in"
      description="Owner sign-in lands in phase 2."
    />
  )
}
