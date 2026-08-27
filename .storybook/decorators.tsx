import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
import { createContext, useContext, useState } from "react"

import type { Decorator } from "@storybook/react-vite"
import type { ReactNode } from "react"

// Shared story harness. Two things in the app are ambient — the router and
// the query client — and a component that touches either can't render in
// isolation without them. Rather than each story hand-rolling a router (the
// record tile used to), they come from here.

// ---------------------------------------------------------------- router --

// Every path a component links to. A story doesn't navigate, but TanStack
// Router type-checks and resolves `to`, so a missing route throws at render
// rather than silently rendering a dead link. Keep in step with routes/.
const PATHS = [
  "/matches",
  "/matches/$matchId",
  "/players/$playerId",
  "/players/$playerId/$category",
  "/compare",
  "/traits",
  "/entry",
  "/login",
  "/manage",
]

// The story is handed in through context rather than baked into the route,
// so changing a control re-renders the story instead of rebuilding a router.
const StorySlot = createContext<ReactNode>(null)

function makeStoryRouter() {
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: function Slot() {
      return <>{useContext(StorySlot)}</>
    },
  })
  const others = PATHS.map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => null,
    })
  )
  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, ...others]),
    history: createMemoryHistory(),
  })
}

function RouterHost() {
  // one router per story mount, so navigation can't leak between stories
  const [router] = useState(makeStoryRouter)
  return <RouterProvider router={router} />
}

/** For any component containing a `<Link>`. */
export const withRouter: Decorator = (Story) => (
  <StorySlot.Provider value={<Story />}>
    <RouterHost />
  </StorySlot.Provider>
)

// ----------------------------------------------------------------- query --

/**
 * For a component that reads through a `use*` hook. Seed the cache with the
 * exact query keys the hooks use and the component renders its loaded state
 * with no network and no mocking of the hook itself — the component under
 * test is the real one, wired the real way.
 *
 * ```ts
 * decorators: [withQueryClient((qc) => {
 *   qc.setQueryData(["insights", "serve", PLAYER_ID, {}], serve())
 * })]
 * ```
 */
export function withQueryClient(
  seed?: (queryClient: QueryClient) => void
): Decorator {
  return function QueryHost(Story) {
    const [client] = useState(() => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            // seeded data is the whole point — never go looking for more
            staleTime: Infinity,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
          },
        },
      })
      seed?.(queryClient)
      return queryClient
    })
    return (
      <QueryClientProvider client={client}>
        <Story />
      </QueryClientProvider>
    )
  }
}

/** Router + a seeded query client, for feature components that use both. */
export function withAppContext(
  seed?: (queryClient: QueryClient) => void
): Array<Decorator> {
  return [withRouter, withQueryClient(seed)]
}
