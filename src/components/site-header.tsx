import { Link } from "@tanstack/react-router"

import { CourtDiagram } from "@/components/court/court-diagram"

const NAV: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/", label: "Players", exact: true },
  { to: "/matches", label: "Matches" },
  { to: "/compare", label: "Compare" },
  { to: "/manage", label: "Manage" },
]

export function SiteHeader() {
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
        <Link
          to="/login"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          Log in
        </Link>
      </div>
    </header>
  )
}
