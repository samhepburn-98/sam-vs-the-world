import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { z } from "zod"

import { GamesTab } from "@/features/manage/components/games-tab"
import { MatchesTab } from "@/features/manage/components/matches-tab"
import { PlayersTab } from "@/features/manage/components/players-tab"
import { RalliesTab } from "@/features/manage/components/rallies-tab"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { ListParams } from "@/features/manage/api/manage-list"

// The raw data browser (§5.4): public read, orthogonal to the drill chain.
// All state — tab, search, page, sort — lives in the URL, so relation links
// are plain Links and every view is shareable. Owner editing lands in #21.

const manageSearch = z.object({
  tab: z.enum(["matches", "games", "rallies", "players"]).catch("matches"),
  q: z.string().catch(""),
  page: z.number().int().min(1).catch(1),
  sort: z.string().catch(""),
  dir: z.enum(["asc", "desc"]).catch("desc"),
})

export const Route = createFileRoute("/manage")({
  validateSearch: (search) => manageSearch.parse(search),
  component: ManagePage,
})

const SEARCH_PLACEHOLDER: Record<string, string> = {
  matches: "Search venue or notes, or paste an id…",
  games: "Game number, or paste a game/match id…",
  rallies: "Rally number, end reason, or paste an id…",
  players: "Search names, or paste an id…",
}

function ManagePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  // write affordances are owner-only in the UI; RLS enforces regardless (§8.5)
  const { user } = Route.useRouteContext()
  const owner = user !== null

  const params: ListParams = {
    page: search.page,
    q: search.q,
    sort: { column: search.sort, dir: search.dir },
  }

  const onSort = (column: string) =>
    void navigate({
      search: (prev) => ({
        ...prev,
        sort: column,
        // first click sorts ascending; a second click flips it
        dir: prev.sort === column && prev.dir === "asc" ? "desc" : "asc",
        page: 1,
      }),
    })
  const onPage = (page: number) =>
    void navigate({ search: (prev) => ({ ...prev, page }) })

  const tabProps = { params, owner, onSort, onPage }

  return (
    <main className="container mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Manage
        </h1>
        <p className="text-muted-foreground text-sm">
          Every stored record, raw. Ids link across tabs.
        </p>
      </header>

      <Tabs
        value={search.tab}
        onValueChange={(tab) =>
          void navigate({
            search: {
              tab: tab as typeof search.tab,
              q: "",
              page: 1,
              sort: "",
              dir: "desc",
            },
          })
        }
      >
        <TabsList>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="rallies">Rallies</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>
      </Tabs>

      <SearchBox
        value={search.q}
        placeholder={SEARCH_PLACEHOLDER[search.tab]}
        onChange={(q) =>
          void navigate({ search: (prev) => ({ ...prev, q, page: 1 }) })
        }
      />

      {search.tab === "matches" && <MatchesTab {...tabProps} />}
      {search.tab === "games" && <GamesTab {...tabProps} />}
      {search.tab === "rallies" && <RalliesTab {...tabProps} />}
      {search.tab === "players" && <PlayersTab {...tabProps} />}
    </main>
  )
}

function SearchBox({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder: string
  onChange: (q: string) => void
}) {
  const [text, setText] = useState(value)

  // the URL is the source of truth (relation links, back button) — follow it
  useEffect(() => {
    setText(value)
  }, [value])

  // debounce typing into the URL
  useEffect(() => {
    if (text === value) return
    const timer = setTimeout(() => onChange(text), 300)
    return () => clearTimeout(timer)
  }, [text, value, onChange])

  return (
    <Input
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      className="max-w-sm"
    />
  )
}
