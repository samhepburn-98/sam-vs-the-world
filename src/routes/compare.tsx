import { useQueries } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { errorProfileOptions } from "@/features/dashboard/api/get-error-profile"
import { momentumOptions } from "@/features/dashboard/api/get-momentum"
import { playerHeadlineOptions } from "@/features/dashboard/api/get-player-headline"
import { rallyLengthsOptions } from "@/features/dashboard/api/get-rally-lengths"
import { serveStatsOptions } from "@/features/dashboard/api/get-serve-stats"
import { Duel } from "@/features/dashboard/components/duel"
import { DuelGlossaryDialog } from "@/features/dashboard/components/duel-glossary"
import { DuelModeToggle, DuelPicker } from "@/features/dashboard/components/duel-picker"
import { H2hPanel } from "@/features/dashboard/components/h2h-panel"
import { CourtEmptyMedia } from "@/components/court/court-empty"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { PlayerData } from "@/features/dashboard/lib/duel-attributes"
import type {
  ErrorProfile,
  InsightFilters,
  Momentum,
  PlayerHeadline,
  RallyLengths,
  ServeStats,
} from "@/features/dashboard/schemas/insights"

// Compare: two players go head to head as a duel — cards on
// the outer edges, the comparison engine down the centre. The mode toggle
// scopes the stats: "all games" is each player's overall form, "head to
// head" runs every stat through the opponent filter, so both sides
// show only their shared games. Selection + mode live in the URL, so a
// duel is shareable.

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

  const pickSlot = (index: number, id: string) => {
    const next = [selected[0], selected[1]]
    next[index] = id
    setSelected(next.filter((x): x is string => Boolean(x)))
  }

  const setMode = (mode: "all" | "h2h") =>
    void navigate({ search: (prev) => ({ ...prev, mode }) })

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

  const player1 = roster.find((p) => p.id === selected[0])
  const player2 = roster.find((p) => p.id === selected[1])
  const ready = Boolean(player1 && player2)

  return (
    <main className="container mx-auto flex max-w-5xl flex-col gap-8 px-3 py-8 sm:gap-10 sm:px-4 sm:py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Compare players
          </h1>
          <p className="text-muted-foreground text-sm">
            Pick two players to see them go head to head.
          </p>
        </div>
        {ready && <DuelGlossaryDialog />}
      </header>

      <div className="flex flex-col items-center gap-5">
        <DuelPicker roster={roster} selected={selected} onPick={pickSlot} />
        {ready && <DuelModeToggle mode={search.mode} onChange={setMode} />}
      </div>

      {!player1 || !player2 ? (
        <Empty>
          <EmptyHeader>
            <CourtEmptyMedia />
            <EmptyTitle className="font-heading">Pick two players</EmptyTitle>
            <EmptyDescription>
              Choose a player in each slot above to see them go head to head.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Duel
            player1={player1}
            player2={player2}
            d1={data[0]}
            d2={data[1]}
            mode={search.mode}
          />
          <H2hPanel
            player1Id={player1.id}
            player2Id={player2.id}
            name1={player1.name}
            name2={player2.name}
          />
        </>
      )}
    </main>
  )
}
