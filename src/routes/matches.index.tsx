import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import {
  MATCHES_PAGE_SIZE,
  matchesQueryOptions,
  useMatches,
} from "@/features/dashboard/api/get-matches"
import { BallDots } from "@/components/ball-dots"
import { CourtEmptyMedia } from "@/components/court/court-empty"
import { PageTitle } from "@/components/typography"
import { MatchRow } from "@/features/dashboard/components/match-row"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Constants } from "@/lib/database.types"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { MatchesParams } from "@/features/dashboard/api/get-matches"
import type { BallType } from "@/lib/schemas/enums"

// Match history (§5.2): every match, newest first — the archive entry point
// and the drill target where every insight lands. Filters and page live in the
// URL, so a filtered history is shareable.

const matchesSearch = z.object({
  player: z.string().uuid().optional().catch(undefined),
  ball: z.enum(Constants.public.Enums.ball_type).optional().catch(undefined),
  from: z.string().date().optional().catch(undefined),
  to: z.string().date().optional().catch(undefined),
  page: z.number().int().min(1).catch(1),
})

type MatchesSearch = z.infer<typeof matchesSearch>

function toParams(s: MatchesSearch): MatchesParams {
  return {
    player: s.player,
    ball: s.ball,
    from: s.from,
    to: s.to,
    page: s.page,
  }
}

export const Route = createFileRoute("/matches/")({
  validateSearch: (search) => matchesSearch.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(matchesQueryOptions(toParams(deps))),
      context.queryClient.ensureQueryData(playersQueryOptions()),
    ])
  },
  component: MatchesPage,
})

function MatchesPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const matches = useMatches(toParams(search))
  const players = usePlayers()
  const nameOf = new Map((players.data ?? []).map((p) => [p.id, p.name]))

  const patch = (next: Partial<MatchesSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...next, page: 1 }) })

  const rows = matches.data?.rows ?? []
  const total = matches.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / MATCHES_PAGE_SIZE))

  return (
    <main className="container mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <header>
        <PageTitle>Match history</PageTitle>
        <p className="text-sm text-muted-foreground">
          Every match, newest first.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={search.player ?? "all"}
          onValueChange={(v) => patch({ player: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-48" aria-label="Player">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All players</SelectItem>
            {(players.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          type="single"
          variant="outline"
          className="flex-wrap"
          value={search.ball ?? ""}
          onValueChange={(v) =>
            patch({ ball: v === "" ? undefined : (v as BallType) })
          }
        >
          {Constants.public.Enums.ball_type.map((ball) => (
            <ToggleGroupItem
              key={ball}
              value={ball}
              aria-label={ball.replace("_", " ")}
            >
              <BallDots ball={ball} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <Input
          type="date"
          aria-label="From date"
          className="w-40"
          value={search.from ?? ""}
          onChange={(e) => patch({ from: e.target.value || undefined })}
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          aria-label="To date"
          className="w-40"
          value={search.to ?? ""}
          onChange={(e) => patch({ to: e.target.value || undefined })}
        />
      </div>

      {rows.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <CourtEmptyMedia />
            <EmptyTitle className="font-heading">No matches found</EmptyTitle>
            <EmptyDescription>
              Nothing matches these filters yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((m) => (
            <li key={m.match_id}>
              <MatchRow
                matchId={m.match_id}
                date={m.date}
                name1={nameOf.get(m.player1_id) ?? "Unknown"}
                name2={nameOf.get(m.player2_id) ?? "Unknown"}
                score1={m.games_won_p1}
                score2={m.games_won_p2}
                outcome={m.outcome}
                venue={m.venue}
                format={m.format}
                ball={m.ball_type}
              />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={search.page <= 1}
            onClick={() =>
              void navigate({ search: (p) => ({ ...p, page: p.page - 1 }) })
            }
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {search.page} of {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={search.page >= pages}
            onClick={() =>
              void navigate({ search: (p) => ({ ...p, page: p.page + 1 }) })
            }
          >
            Next
          </Button>
        </div>
      )}
    </main>
  )
}
