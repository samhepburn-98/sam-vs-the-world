import {
  BetweenHorizontalStartIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"

import {
  BoolCell,
  EnumCell,
  NullCell,
  RelCell,
  TsCell,
} from "@/features/manage/components/cells"
import { DataTable } from "@/features/manage/components/data-table"
import { ConfirmDelete } from "@/features/manage/components/confirm-delete"
import { EditRallyDialog } from "@/features/manage/components/edit-rally-dialog"
import { Button } from "@/components/ui/button"
import { useDeleteRally } from "@/lib/api/delete-rally"
import { friendlyWriteError } from "@/lib/api/friendly-errors"
import { useManageRallies } from "@/features/manage/api/get-manage-rallies"
import { usePlayers } from "@/lib/api/get-players"

import type { ManageColumn } from "@/features/manage/components/data-table"
import type { ListParams } from "@/features/manage/api/manage-list"
import type { RallyDbRowWithGame } from "@/lib/schemas/rally"

interface TabProps {
  params: ListParams
  owner: boolean
  onSort: (column: string) => void
  onPage: (page: number) => void
}

export function RalliesTab({ params, owner, onSort, onPage }: TabProps) {
  const rallies = useManageRallies({ params })
  const del = useDeleteRally()
  const [sheet, setSheet] = useState<{
    rally: RallyDbRowWithGame
    mode: "edit" | "insert"
  } | null>(null)
  const [deleting, setDeleting] = useState<RallyDbRowWithGame | null>(null)
  const players = usePlayers()
  const nameOf = (id: string) =>
    players.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: Array<ManageColumn<RallyDbRowWithGame>> = [
    {
      key: "game_id",
      label: "Game",
      render: (r) => (
        <RelCell
          tab="games"
          id={r.game_id}
          label={`G${r.games.game_number} · ${nameOf(r.games.matches.player1_id)} vs ${nameOf(r.games.matches.player2_id)} · ${r.games.matches.date}`}
        />
      ),
    },
    {
      key: "rally_number",
      label: "Rally #",
      sortable: true,
      render: (r) => r.rally_number,
    },
    {
      key: "server_id",
      label: "Server",
      render: (r) => (
        <RelCell tab="players" id={r.server_id} label={nameOf(r.server_id)} />
      ),
    },
    {
      key: "serve_side",
      label: "Box",
      render: (r) => <EnumCell value={r.serve_side} />,
    },
    {
      key: "serve_number",
      label: "Serve",
      sortable: true,
      render: (r) => r.serve_number,
    },
    {
      key: "winner_id",
      label: "Winner",
      render: (r) =>
        r.winner_id ? (
          <RelCell tab="players" id={r.winner_id} label={nameOf(r.winner_id)} />
        ) : (
          <NullCell />
        ),
    },
    {
      key: "end_reason",
      label: "End reason",
      sortable: true,
      render: (r) => <EnumCell value={r.end_reason} />,
    },
    {
      key: "error_detail",
      label: "Detail",
      render: (r) =>
        r.error_detail ? <EnumCell value={r.error_detail} /> : <NullCell />,
    },
    {
      key: "forced",
      label: "Forced",
      render: (r) => <BoolCell value={r.forced} />,
    },
    {
      key: "winning_shot",
      label: "Winning shot",
      render: (r) =>
        r.winning_shot ? <EnumCell value={r.winning_shot} /> : <NullCell />,
    },
    {
      key: "losing_shot",
      label: "Losing shot",
      render: (r) =>
        r.losing_shot ? <EnumCell value={r.losing_shot} /> : <NullCell />,
    },
    {
      key: "shot_count",
      label: "Shots",
      sortable: true,
      render: (r) => r.shot_count ?? <NullCell />,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (r) => <TsCell iso={r.created_at} />,
    },
    {
      key: "updated_at",
      label: "Updated",
      sortable: true,
      render: (r) => <TsCell iso={r.updated_at} />,
    },
    ...(owner
      ? [
          {
            key: "actions",
            label: "",
            render: (r: RallyDbRowWithGame) => (
              <span className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Insert a rally before #${r.rally_number}`}
                  title="Insert a missed rally before this one"
                  onClick={() => setSheet({ rally: r, mode: "insert" })}
                >
                  <BetweenHorizontalStartIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit rally #${r.rally_number}`}
                  onClick={() => setSheet({ rally: r, mode: "edit" })}
                >
                  <PencilIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete rally #${r.rally_number}`}
                  onClick={() => setDeleting(r)}
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
        result={rallies.data}
        isPending={rallies.isPending || rallies.isFetching}
        isError={rallies.isError}
        onRetry={() => void rallies.refetch()}
        pageNumber={params.page}
        sort={params.sort}
        onSort={onSort}
        onPage={onPage}
        rowKey={(r) => r.id}
      />
      {sheet && (
        <EditRallyDialog
          rally={sheet.rally}
          mode={sheet.mode}
          onClose={() => setSheet(null)}
        />
      )}
      <ConfirmDelete
        open={deleting !== null}
        title={`Delete rally #${deleting?.rally_number ?? ""}?`}
        description="The score recalculates on its own — a gap in the rally numbers is fine."
        pending={del.isPending}
        error={del.isError ? friendlyWriteError(del.error) : null}
        onCancel={() => {
          setDeleting(null)
          del.reset()
        }}
        onConfirm={() => {
          if (!deleting) return
          del.mutate(
            { ...deleting, serve_number: deleting.serve_number === 2 ? 2 : 1 },
            { onSuccess: () => setDeleting(null) }
          )
        }}
      />
    </>
  )
}
