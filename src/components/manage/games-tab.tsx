import { PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"

import { NullCell, RelCell, TsCell } from "@/components/manage/cells"
import { ConfirmDelete } from "@/components/manage/confirm-delete"
import { DataTable } from "@/components/manage/data-table"
import { EditGameSheet } from "@/components/manage/edit-game-sheet"
import { Button } from "@/components/ui/button"
import { useDeleteGame } from "@/lib/queries/delete-game"
import { friendlyWriteError } from "@/lib/queries/friendly-errors"
import { useManageGames } from "@/lib/queries/get-manage-games"
import { usePlayers } from "@/lib/queries/get-players"

import type { ManageColumn } from "@/components/manage/data-table"
import type { ListParams } from "@/lib/queries/manage-list"
import type { GameBrowserRow } from "@/lib/schemas/game"

interface TabProps {
  params: ListParams
  owner: boolean
  onSort: (column: string) => void
  onPage: (page: number) => void
}

export function GamesTab({ params, owner, onSort, onPage }: TabProps) {
  const games = useManageGames(params)
  const del = useDeleteGame()
  const [editing, setEditing] = useState<GameBrowserRow | null>(null)
  const [deleting, setDeleting] = useState<GameBrowserRow | null>(null)
  const players = usePlayers()
  const nameOf = (id: string) =>
    players.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: Array<ManageColumn<GameBrowserRow>> = [
    {
      key: "match_id",
      label: "Match",
      render: (g) => (
        <RelCell
          tab="matches"
          id={g.match_id}
          label={`${nameOf(g.matches.player1_id)} vs ${nameOf(g.matches.player2_id)} · ${g.matches.date}`}
        />
      ),
    },
    {
      key: "game_number",
      label: "Game #",
      sortable: true,
      render: (g) => g.game_number,
    },
    {
      key: "score",
      label: "Score",
      render: (g) =>
        g.result ? (
          <span className="font-semibold tabular-nums">
            {g.result.score_p1}–{g.result.score_p2}
          </span>
        ) : (
          <span className="text-muted-foreground">no rallies yet</span>
        ),
    },
    {
      key: "winner",
      label: "Winner",
      render: (g) =>
        g.result?.winner_id ? (
          <RelCell
            tab="players"
            id={g.result.winner_id}
            label={nameOf(g.result.winner_id)}
          />
        ) : g.result?.is_undecided ? (
          <span className="text-muted-foreground">tied</span>
        ) : (
          <NullCell />
        ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (g) => <TsCell iso={g.created_at} />,
    },
    {
      key: "updated_at",
      label: "Updated",
      sortable: true,
      render: (g) => <TsCell iso={g.updated_at} />,
    },
    {
      key: "rel",
      label: "",
      render: (g) => <RelCell tab="rallies" id={g.id} label="Rallies" />,
    },
    ...(owner
      ? [
          {
            key: "actions",
            label: "",
            render: (g: GameBrowserRow) => (
              <span className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit game ${g.game_number}`}
                  onClick={() => setEditing(g)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete game ${g.game_number}`}
                  onClick={() => setDeleting(g)}
                >
                  <Trash2Icon />
                </Button>
              </span>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <DataTable
        columns={columns}
        result={games.data}
        isPending={games.isPending || games.isFetching}
        isError={games.isError}
        onRetry={() => void games.refetch()}
        pageNumber={params.page}
        sort={params.sort}
        onSort={onSort}
        onPage={onPage}
        rowKey={(g) => g.id}
      />
      {editing && (
        <EditGameSheet game={editing} onClose={() => setEditing(null)} />
      )}
      <ConfirmDelete
        open={deleting !== null}
        title={`Delete game ${deleting?.game_number ?? ""}?`}
        description="Deletes this game and every rally in it. This can't be undone."
        pending={del.isPending}
        error={del.isError ? friendlyWriteError(del.error) : null}
        onCancel={() => {
          setDeleting(null)
          del.reset()
        }}
        onConfirm={() => {
          if (!deleting) return
          del.mutate(
            {
              id: deleting.id,
              matchId: deleting.match_id,
              gameNumber: deleting.game_number,
            },
            { onSuccess: () => setDeleting(null) },
          )
        }}
      />
    </>
  )
}
