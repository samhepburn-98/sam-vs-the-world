import { Link, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"

import { CourtDiagram } from "@/components/court/court-diagram"
import { signOut } from "@/lib/auth/functions"

import type { SessionUser } from "@/lib/auth/functions"

const NAV: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/", label: "Players", exact: true },
  { to: "/matches", label: "Matches" },
  { to: "/compare", label: "Compare" },
  { to: "/manage", label: "Manage" },
]

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const router = useRouter()
  const signOutFn = useServerFn(signOut)

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <CourtDiagram className="h-6 w-4" label="Sam vs the World" />
          <span className="font-heading text-sm font-bold tracking-tight">
            Sam vs the World
          </span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className="text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 transition-colors"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <Link
              to="/entry"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              Log
            </Link>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={() => {
                void (async () => {
                  await signOutFn({})
                  await router.invalidate()
                  await router.navigate({ to: "/" })
                })()
              }}
            >
              Log out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  )
}
