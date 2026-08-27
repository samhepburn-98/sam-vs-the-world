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

// Every path a component links to, so a `<Link>` renders against a route that
// exists. Note what this does NOT buy you: a path missing from this list does
// not throw — the link simply resolves to nothing, silently, and the story
// still looks fine. `to` is type-checked against routeTree.gen.ts, not against
// this array, so adding a route to src/routes/ will never remind you to add it
// here. Keep it in step with routes/ by hand.
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
 *   qc.setQueryData(["insights", "serve-stats", IDS.sam, {}], serve())
 * })]
 * ```
 *
 * **Get the key exactly right, or the story hits the network.** The options
 * below govern *refetching data that is already cached*; they do nothing for a
 * cache miss, which mounts pending and calls its queryFn like any other query.
 * So a mistyped key doesn't render an empty state — it reaches
 * `getSupabaseBrowserClient()` and either throws on missing env or silently
 * reads the real database. Copy the key from the hook's own file under the
 * feature's `api/` folder; don't reconstruct it from the name. Some carry a
 * trailing member that is easy to miss — `momentum` ends
 * `..., filters, deficit ?? null]`.
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
            // stop anything SEEDED from being refetched. A cache miss still
            // fetches — see the warning above.
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
