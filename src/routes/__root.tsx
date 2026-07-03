import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import { PageStub } from "@/components/page-stub"
import { SiteHeader } from "@/components/site-header"
import { fetchUser } from "@/lib/auth/functions"

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

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
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
