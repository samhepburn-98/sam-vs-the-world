import { Link, useRouter } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { MenuIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { signOut } from "@/lib/auth/functions"

import type { SessionUser } from "@/lib/auth/functions"

const NAV: Array<{ to: string; label: string; exact?: boolean }> = [
  { to: "/", label: "Players", exact: true },
  { to: "/matches", label: "Matches" },
  { to: "/compare", label: "Compare" },
  { to: "/manage", label: "Manage" },
]

// The one-way navigation ramp maps down to a sheet on narrow screens (§10):
// the inline row is fine on tablet+, but the wordmark plus five links overruns
// 375px, so below md the links move into a slide-in menu behind one button.

const linkBase =
  "px-2.5 py-1.5 font-heading text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const router = useRouter()
  const signOutFn = useServerFn(signOut)

  const handleSignOut = () => {
    void (async () => {
      await signOutFn({})
      await router.invalidate()
      await router.navigate({ to: "/" })
    })()
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        {/* the brand lozenge: ember, leaning, text counter-skewed upright */}
        <Link
          to="/"
          className="shrink-0 skew-badge bg-primary px-3 py-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span className="skew-badge-text font-heading text-[15px] font-extrabold tracking-[0.04em] whitespace-nowrap text-primary-foreground uppercase">
            Sam vs the World
          </span>
        </Link>

        {/* tablet and up: the full inline nav */}
        <nav className="hidden flex-1 items-center gap-1 text-sm md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className={linkBase}
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 text-sm md:flex">
          {user ? (
            <>
              <Link
                to="/entry"
                className={linkBase}
                activeProps={{ className: "text-foreground font-medium" }}
              >
                Log
              </Link>
              <button
                type="button"
                className={`${linkBase} cursor-pointer`}
                onClick={handleSignOut}
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className={linkBase}>
              Log in
            </Link>
          )}
        </div>

        {/* mobile: everything behind one button */}
        <div className="ml-auto md:hidden">
          <MobileMenu user={user} onSignOut={handleSignOut} />
        </div>
      </div>
    </header>
  )
}

function MobileMenu({
  user,
  onSignOut,
}: {
  user: SessionUser | null
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const close = () => {
    setOpen(false)
  }

  const itemClass =
    "px-2 py-2 font-heading text-base font-bold tracking-[0.1em] uppercase text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Open menu">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 gap-0 p-0">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 pb-4">
          {NAV.map((item) => (
            <SheetClose asChild key={item.to}>
              <Link
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                className={itemClass}
                activeProps={{ className: "text-foreground font-medium" }}
                onClick={close}
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
          <div className="my-2 border-t" />
          {user ? (
            <>
              <SheetClose asChild>
                <Link
                  to="/entry"
                  className={itemClass}
                  activeProps={{ className: "text-foreground font-medium" }}
                  onClick={close}
                >
                  Log a match
                </Link>
              </SheetClose>
              <button
                type="button"
                className={`${itemClass} cursor-pointer text-left`}
                onClick={() => {
                  close()
                  onSignOut()
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <SheetClose asChild>
              <Link to="/login" className={itemClass} onClick={close}>
                Log in
              </Link>
            </SheetClose>
          )}
          <div className="my-2 border-t" />
        </nav>
      </SheetContent>
    </Sheet>
  )
}
