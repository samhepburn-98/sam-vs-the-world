import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"

import {
  RecordTile,
  RecordsWall,
} from "@/features/dashboard/components/record-tile"

import type { RecordTileDisplay } from "@/features/dashboard/lib/record-display"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ReactNode } from "react"

// RecordTile links to the match its record was set in, so stories mount a
// minimal memory router: the story renders at "/", and the match route
// exists for the links to resolve against.

function StoryRouter({ children }: { children: ReactNode }) {
  const rootRoute = createRootRoute()
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{children}</>,
  })
  const matchRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/matches/$matchId",
    component: () => null,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, matchRoute]),
    history: createMemoryHistory(),
  })
  return <RouterProvider router={router} />
}

const record = (overrides: Partial<RecordTileDisplay>): RecordTileDisplay => ({
  key: "longest_rally",
  title: "Longest rally",
  value: "23",
  unit: "shots",
  lead: "Alex",
  isHolder: true,
  rest: "14 Jul 2026",
  tone: "p2",
  matchId: "m1",
  ...overrides,
})

const THE_WALL: Array<RecordTileDisplay> = [
  record({
    key: "biggest_win",
    title: "Biggest win",
    value: "3–0",
    unit: null,
    lead: "Sam",
    tone: "p1",
  }),
  // Sam held this one from the p2 slot: blue on the wall (match-anchored),
  // repainted ember by the RecordsHeld story's tone override below.
  record({ key: "longest_rally", lead: "Sam", matchId: "m2" }),
  record({
    key: "best_streak",
    title: "Best streak",
    value: "6",
    unit: "wins",
    lead: "Sam",
    tone: "p1",
    matchId: "m3",
  }),
  record({
    key: "marathon_game",
    title: "Marathon game",
    value: "27",
    unit: "rallies",
    lead: "Sam v Alex",
    isHolder: false,
    rest: "15–13 · 14 Jul 2026",
    tone: null,
    matchId: "m4",
  }),
  record({
    key: "most_aces",
    title: "Most aces in a match",
    value: "5",
    unit: null,
    lead: "Sam",
    tone: "p1",
    matchId: "m5",
  }),
  record({
    key: "most_lets",
    title: "Most lets in a match",
    value: "9",
    unit: null,
    lead: "Sam v Ormond",
    isHolder: false,
    tone: null,
    matchId: "m6",
  }),
]

const meta = {
  title: "UI/Record tile",
  component: RecordTile,
  decorators: [
    (Story) => (
      <StoryRouter>
        <Story />
      </StoryRouter>
    ),
  ],
  args: { record: record({}) },
} satisfies Meta<typeof RecordTile>

export default meta
type Story = StoryObj<typeof meta>

export const HolderRecord: Story = {
  render: () => (
    <div className="w-56">
      <RecordTile record={record({})} />
    </div>
  ),
}

export const MatchOwnedRecord: Story = {
  render: () => (
    <div className="w-56">
      <RecordTile
        record={record({
          key: "marathon_game",
          title: "Marathon game",
          value: "27",
          unit: "rallies",
          lead: "Sam v Alex",
          isHolder: false,
          rest: "15–13 · 14 Jul 2026",
          tone: null,
        })}
      />
    </div>
  ),
}

export const TheWall: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <RecordsWall records={THE_WALL} />
    </div>
  ),
}

// The profile shelf: the same held records, every tile repainted in the
// player's own ember — including the longest rally Sam set from the p2
// slot, which the home wall shows in blue.
export const RecordsHeld: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <RecordsWall
        records={THE_WALL.filter((r) => r.lead === "Sam")}
        tone="p1"
      />
    </div>
  ),
}
