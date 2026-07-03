import { PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"

import { EnumCell, NullCell, TsCell } from "@/components/manage/cells"
import { ConfirmDelete } from "@/components/manage/confirm-delete"
import { DataTable } from "@/components/manage/data-table"
import { EditPlayerSheet } from "@/components/manage/edit-player-sheet"
import { Button } from "@/components/ui/button"
import { useDeletePlayer } from "@/lib/queries/delete-player"
import { friendlyWriteError } from "@/lib/queries/friendly-errors"
import { useManagePlayers } from "@/lib/queries/get-manage-players"

import type { ManageColumn } from "@/components/manage/data-table"
import type { ListParams } from "@/lib/queries/manage-list"
import type { PlayerRow } from "@/lib/schemas/player"

interface TabProps {
  params: ListParams
  owner: boolean
  onSort: (column: string) => void
  onPage: (page: number) => void
}

export function PlayersTab({ params, owner, onSort, onPage }: TabProps) {
  const players = useManagePlayers(params)
  const del = useDeletePlayer()
  const [editing, setEditing] = useState<PlayerRow | null>(null)
  const [deleting, setDeleting] = useState<PlayerRow | null>(null)

  const columns: Array<ManageColumn<PlayerRow>> = [
    { key: "name", label: "Name", sortable: true, render: (p) => p.name },
    {
      key: "handedness",
      label: "Handedness",
      sortable: true,
      render: (p) =>
        p.handedness ? <EnumCell value={p.handedness} /> : <NullCell />,
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (p) => <TsCell iso={p.created_at} />,
    },
    {
      key: "updated_at",
      label: "Updated",
      sortable: true,
      render: (p) => <TsCell iso={p.updated_at} />,
    },
    ...(owner
      ? [
          {
            key: "actions",
            label: "",
            render: (p: PlayerRow) => (
              <span className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => setEditing(p)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${p.name}`}
                  onClick={() => setDeleting(p)}
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
        result={players.data}
        isPending={players.isPending || players.isFetching}
        isError={players.isError}
        onRetry={() => void players.refetch()}
        pageNumber={params.page}
        sort={params.sort}
        onSort={onSort}
        onPage={onPage}
        rowKey={(p) => p.id}
      />
      {editing && (
        <EditPlayerSheet player={editing} onClose={() => setEditing(null)} />
      )}
      <ConfirmDelete
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? "player"}?`}
        description="A player who appears in any match is protected — the delete will be refused."
        pending={del.isPending}
        error={del.isError ? friendlyWriteError(del.error) : null}
        onCancel={() => {
          setDeleting(null)
          del.reset()
        }}
        onConfirm={() => {
          if (!deleting) return
          del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }}
      />
    </>
  )
}
