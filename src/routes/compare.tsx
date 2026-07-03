import { useQueries } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { z } from "zod"

import { errorProfileOptions } from "@/features/dashboard/api/get-error-profile"
import { momentumOptions } from "@/features/dashboard/api/get-momentum"
import { playerHeadlineOptions } from "@/features/dashboard/api/get-player-headline"
import { rallyLengthsOptions } from "@/features/dashboard/api/get-rally-lengths"
import { serveStatsOptions } from "@/features/dashboard/api/get-serve-stats"
import { H2hPanel } from "@/features/dashboard/components/h2h-panel"
import {
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/utils/insight-thresholds"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type {
  ErrorProfile,
  Momentum,
  PlayerHeadline,
  RallyLengths,
  ServeStats,
} from "@/features/dashboard/schemas/insights"
import type { ReactNode } from "react"

// Compare (§5.1, §2.3): selected players' profiles side by side, aligned row
// by row, plus head-to-head when exactly two who've played are chosen.
// Selection lives in the URL (?players=id,id) so a comparison is shareable.

const compareSearch = z.object({
  players: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/compare")({
  validateSearch: (search) => compareSearch.parse(search),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(playersQueryOptions())
  },
  component: ComparePage,
})

const MAX_PLAYERS = 4

interface PlayerData {
  headline?: PlayerHeadline
  serve?: ServeStats
  error?: ErrorProfile
  rally?: RallyLengths
  momentum?: Momentum
}

function pct(n: number, d: number) {
  return Math.round((n / d) * 100)
}

function rateCell(won: number, of: number, min: number): ReactNode {
  if (of < min)
    return (
      <span className="text-muted-foreground tabular-nums">n={of}</span>
    )
  return (
    <span className="tabular-nums">
      {pct(won, of)}%{" "}
      <span className="text-muted-foreground">
        · {won}/{of}
      </span>
    </span>
  )
}

const ROWS: Array<{ label: string; cell: (d: PlayerData) => ReactNode }> = [
  {
    label: "Win rate",
    cell: (d) =>
      d.headline
        ? rateCell(d.headline.games_won, d.headline.games_decided, MIN_GAMES_FOR_WIN_RATE)
        : "—",
  },
  {
    label: "Games record",
    cell: (d) =>
      d.headline ? (
        <span className="tabular-nums">
          {d.headline.games_won}–
          {d.headline.games_decided - d.headline.games_won}
        </span>
      ) : (
        "—"
      ),
  },
  {
    label: "Serve win rate",
    cell: (d) =>
      d.serve
        ? rateCell(d.serve.serve_wins, d.serve.rallies_served, MIN_RALLIES_FOR_RATE)
        : "—",
  },
  {
    label: "Unforced / game",
    cell: (d) =>
      !d.error ? (
        "—"
      ) : d.error.games_played < MIN_GAMES_FOR_WIN_RATE ? (
        <span className="text-muted-foreground tabular-nums">
          n={d.error.games_played}
        </span>
      ) : (
        <span className="tabular-nums">
          {(d.error.unforced_errors / d.error.games_played).toFixed(1)}
        </span>
      ),
  },
  {
    label: "Avg rally length",
    cell: (d) =>
      !d.rally ? (
        "—"
      ) : d.rally.total_rallies < MIN_RALLIES_FOR_RATE ? (
        <span className="text-muted-foreground tabular-nums">
          n={d.rally.total_rallies}
        </span>
      ) : (
        <span className="tabular-nums">
          {d.rally.avg_length?.toFixed(1) ?? "—"}
        </span>
      ),
  },
  {
    label: "Comebacks",
    cell: (d) =>
      d.momentum ? (
        <span className="tabular-nums">{d.momentum.comebacks}</span>
      ) : (
        "—"
      ),
  },
]

function ComparePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const players = usePlayers()
  const roster = players.data ?? []

  const selected = (search.players?.split(",") ?? [])
    .filter((id) => roster.some((p) => p.id === id))
    .slice(0, MAX_PLAYERS)

  const setSelected = (next: Array<string>) =>
    void navigate({
      search: { players: next.length > 0 ? next.join(",") : undefined },
    })

  // 5 aggregates per player, in one stable hook regardless of how many
  const results = useQueries({
    queries: selected.flatMap((id) => [
      playerHeadlineOptions(id),
      serveStatsOptions(id),
      errorProfileOptions(id),
      rallyLengthsOptions(id),
      momentumOptions(id),
    ]),
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
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Compare players
        </h1>
        <p className="text-muted-foreground text-sm">
          Pick two or more players to line their games up side by side.
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
        {addable.length > 0 && selected.length < MAX_PLAYERS && (
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
              Pick players to compare
            </EmptyTitle>
            <EmptyDescription>
              Add at least two players above to see their profiles side by side.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Metric</TableHead>
                  {selected.map((id) => (
                    <TableHead key={id}>{nameOf(id)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROWS.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="text-muted-foreground">
                      {row.label}
                    </TableCell>
                    {data.map((d, i) => (
                      <TableCell key={selected[i]}>{row.cell(d)}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selected.length === 2 && (
            <H2hPanel
              player1Id={selected[0]}
              player2Id={selected[1]}
              name1={nameOf(selected[0])}
              name2={nameOf(selected[1])}
            />
          )}
        </>
      )}
    </main>
  )
}
