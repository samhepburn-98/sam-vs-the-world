import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { usePlayerInsights } from "@/features/dashboard/api/use-player-insights"
import { AttributeGlossaryDialog } from "@/features/dashboard/components/attribute-glossary"
import { Duel } from "@/features/dashboard/components/duel"
import { DuelModeToggle } from "@/features/dashboard/components/duel-mode-toggle"
import { DuelPicker } from "@/features/dashboard/components/duel-picker"
import { H2hPanel } from "@/features/dashboard/components/h2h-panel"
import { Atmosphere } from "@/components/atmosphere"
import { CourtEmptyMedia } from "@/components/court/court-empty"
import { PageTitle } from "@/components/typography"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { InsightFilters } from "@/features/dashboard/schemas/insights"

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

  const d1 = usePlayerInsights(selected[0], filtersFor(0))
  const d2 = usePlayerInsights(selected[1], filtersFor(1))

  const player1 = roster.find((p) => p.id === selected[0])
  const player2 = roster.find((p) => p.id === selected[1])
  const ready = Boolean(player1 && player2)

  return (
    <main className="container mx-auto flex max-w-5xl flex-col gap-8 px-3 py-8 sm:gap-10 sm:px-4 sm:py-12">
      {/* with a duel on screen, the split atmosphere overrides the root's solo
          glow — ember for player one's side, blue for player two's */}
      {ready && <Atmosphere tone="duel" />}
      <header className="flex items-start justify-between gap-4">
        <div>
          <PageTitle>Compare players</PageTitle>
          <p className="text-sm text-muted-foreground">
            Pick two players to see them go head to head.
          </p>
        </div>
        {ready && <AttributeGlossaryDialog />}
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
            d1={d1}
            d2={d2}
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
