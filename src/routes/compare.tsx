import { useQueries } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { z } from "zod"

import { errorProfileOptions } from "@/features/dashboard/api/get-error-profile"
import { momentumOptions } from "@/features/dashboard/api/get-momentum"
import { playerHeadlineOptions } from "@/features/dashboard/api/get-player-headline"
import { rallyLengthsOptions } from "@/features/dashboard/api/get-rally-lengths"
import { serveStatsOptions } from "@/features/dashboard/api/get-serve-stats"
import { CompareShowcase } from "@/features/dashboard/components/compare-showcase"
import { H2hPanel } from "@/features/dashboard/components/h2h-panel"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { PlayerData } from "@/features/dashboard/components/compare-showcase"
import type {
  ErrorProfile,
  InsightFilters,
  Momentum,
  PlayerHeadline,
  RallyLengths,
  ServeStats,
} from "@/features/dashboard/schemas/insights"

// Compare (§5.1, §2.3): two players go head to head. The mode toggle scopes
// the stats — "all games" is each player's overall form, "head to head" runs
// every stat through the opponent filter (§3.6), so both sides show only
// their shared games. Selection + mode live in the URL, so it's shareable.

const compareSearch = z.object({
  players: z.string().optional().catch(undefined),
  mode: z.enum(["all", "h2h"]).catch("all"),
})

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => compareSearch.parse(search),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(playersQueryOptions())
  },
  component: ComparePage,
})

function ComparePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const players = usePlayers()
  const roster = players.data ?? []

  const selected = (search.players?.split(",") ?? [])
    .filter((id) => roster.some((p) => p.id === id))
    .slice(0, 2)

  const setSelected = (next: Array<string>) =>
    void navigate({
      search: (prev) => ({
        ...prev,
        players: next.length > 0 ? next.join(",") : undefined,
      }),
    })

  const h2h = selected.length === 2 && search.mode === "h2h"
  // in head-to-head, each player's stats are filtered to games against the other
  const filtersFor = (i: number): InsightFilters =>
    h2h ? { opponentId: selected[i === 0 ? 1 : 0] } : {}

  const results = useQueries({
    queries: selected.flatMap((id, i) => {
      const f = filtersFor(i)
      return [
        playerHeadlineOptions(id, f),
        serveStatsOptions(id, f),
        errorProfileOptions(id, f),
        rallyLengthsOptions(id, f),
        momentumOptions(id, f),
      ]
    }),
  })
  const data: Array<PlayerData> = selected.map((_, i) => ({
    headline: results[i * 5]?.data as PlayerHeadline | undefined,
    serve: results[i * 5 + 1]?.data as ServeStats | undefined,
    error: results[i * 5 + 2]?.data as ErrorProfile | undefined,
    rally: results[i * 5 + 3]?.data as RallyLengths | undefined,
    momentum: results[i * 5 + 4]?.data as Momentum | undefined,
  }))

  const nameOf = (id: string) => roster.find((p) => p.id === id)?.name ?? "?"
  const addable = roster.filter((p) => !selected.includes(p.id))

  return (
    <main className="container mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Compare players
        </h1>
        <p className="text-muted-foreground text-sm">
          Pick two players to see them go head to head.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {selected.map((id) => (
          <Badge key={id} variant="secondary" className="gap-1 py-1 pr-1 pl-2">
            {nameOf(id)}
            <button
              type="button"
              aria-label={`Remove ${nameOf(id)}`}
              className="hover:bg-foreground/10 rounded-full p-0.5"
              onClick={() => setSelected(selected.filter((x) => x !== id))}
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
        {addable.length > 0 && selected.length < 2 && (
          <Select value="" onValueChange={(v) => setSelected([...selected, v])}>
            <SelectTrigger className="w-40" aria-label="Add player">
              <SelectValue placeholder="Add player…" />
            </SelectTrigger>
            <SelectContent>
              {addable.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selected.length < 2 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="font-heading">
              Pick two players
            </EmptyTitle>
            <EmptyDescription>
              Add two players above to see them go head to head.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="flex justify-center">
            <ToggleGroup
              type="single"
              variant="outline"
              value={search.mode}
              onValueChange={(v) =>
                v &&
                void navigate({
                  search: (prev) => ({ ...prev, mode: v as "all" | "h2h" }),
                })
              }
            >
              <ToggleGroupItem value="all">All games</ToggleGroupItem>
              <ToggleGroupItem value="h2h">Head to head</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <CompareShowcase
            name1={nameOf(selected[0])}
            name2={nameOf(selected[1])}
            d1={data[0]}
            d2={data[1]}
          />
          <H2hPanel
            player1Id={selected[0]}
            player2Id={selected[1]}
            name1={nameOf(selected[0])}
            name2={nameOf(selected[1])}
          />
        </>
      )}
    </main>
  )
}
