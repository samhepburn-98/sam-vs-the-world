import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import { PageStub } from "@/components/layouts/page-stub"
import { SiteHeader } from "@/components/layouts/site-header"
import { fetchUser } from "@/lib/auth/functions"
import { NO_FLASH_SCRIPT } from "@/lib/theme"

import appCss from "../styles.css?url"

import type { QueryClient } from "@tanstack/react-query"

// The router supplies queryClient at creation (router.tsx); typing it here
// lets route loaders reach it for SSR data prefetch (ensureQueryData).
interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // Session context for the whole tree: header state + route guards (§8.5).
  beforeLoad: async () => {
    const user = await fetchUser()
    return { user }
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Sam vs the World",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <PageStub
      title="Not found"
      description="That page doesn't exist — the rally went out of court."
    />
  ),
  shellComponent: RootDocument,
})

function Header() {
  const { user } = Route.useRouteContext()
  return <SiteHeader user={user} />
}

// Soft route transition (§4.8): a quiet fade-in on the incoming page, keyed by
// path so it retriggers on every navigation. motion-safe only, so it degrades
// to an instant swap under prefers-reduced-motion — and it's a plain CSS
// animation, not the native view-transition API (which blanks Start's
// full-document hydration on load).
function RouteFade({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <div
      key={pathname}
      className="motion-safe:animate-in motion-safe:duration-300 motion-safe:fade-in"
    >
      {children}
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    // the no-flash script (below) sets the theme class on <html> before paint;
    // suppressHydrationWarning stops React from reverting it during hydration
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* runs synchronously before first paint — no flash of the wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        <Header />
        <RouteFade>{children}</RouteFade>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
