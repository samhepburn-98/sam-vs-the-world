import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { CourtDiagram } from "@/components/court/court-diagram"
import { LoginForm } from "@/features/auth/components/login-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signIn } from "@/lib/auth/functions"

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: "/entry" })
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const signInFn = useServerFn(signIn)

  return (
    <main className="container mx-auto flex max-w-sm flex-col px-4 py-16">
      <Card>
        <CardHeader className="items-center text-center">
          <CourtDiagram className="text-muted-foreground mx-auto mb-2 h-14 w-9" />
          <CardTitle className="font-heading">Owner sign in</CardTitle>
          <CardDescription>
            Logging and editing are owner-only; everything else is public.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            onSubmit={async (input) => {
              const { error } = await signInFn({ data: input })
              if (error) return error
              await router.invalidate()
              await router.navigate({ to: "/entry" })
              return null
            }}
          />
        </CardContent>
      </Card>
    </main>
  )
}
