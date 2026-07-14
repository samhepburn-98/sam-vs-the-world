import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"

import {
  MATCHES_PAGE_SIZE,
  matchesQueryOptions,
  useMatches,
} from "@/features/dashboard/api/get-matches"
import { BallDots } from "@/components/ball-dots"
import { CourtEmptyMedia } from "@/components/court/court-empty"
import { Badge } from "@/components/ui/badge"
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
import type { MatchListRow } from "@/lib/schemas/match"

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

function formatBadge(format: number | null) {
  return format === null ? "Casual" : `Best of ${format}`
}

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
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Match history
        </h1>
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
        <ul className="flex flex-col divide-y">
          {rows.map((m) => (
            <MatchListItem key={m.match_id} match={m} nameOf={nameOf} />
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

function MatchListItem({
  match,
  nameOf,
}: {
  match: MatchListRow
  nameOf: Map<string, string>
}) {
  const p1 = nameOf.get(match.player1_id) ?? "Unknown"
  const p2 = nameOf.get(match.player2_id) ?? "Unknown"
  const hasScore = match.games_won_p1 !== null && match.games_won_p2 !== null

  return (
    <li>
      <Link
        to="/matches/$matchId"
        params={{ matchId: match.match_id }}
        search={{ rally: undefined }}
        className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-muted/50"
      >
        <span className="w-24 shrink-0 text-sm text-muted-foreground tabular-nums">
          {match.date}
        </span>
        <span className="flex-1 truncate text-sm">
          <span
            className={
              match.match_winner_id === match.player1_id ? "font-semibold" : ""
            }
          >
            {p1}
          </span>{" "}
          <span className="text-muted-foreground">vs</span>{" "}
          <span
            className={
              match.match_winner_id === match.player2_id ? "font-semibold" : ""
            }
          >
            {p2}
          </span>
          {match.venue && (
            <span className="text-muted-foreground"> · {match.venue}</span>
          )}
        </span>
        {hasScore && (
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {match.games_won_p1}–{match.games_won_p2}
          </span>
        )}
        <Badge variant="outline" className="shrink-0">
          {formatBadge(match.format)}
        </Badge>
        {match.ball_type && <BallDots ball={match.ball_type} />}
      </Link>
    </li>
  )
}
