import { PencilIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"

import { BallDots } from "@/components/ball-dots"
import {
  BoolCell,
  EnumCell,
  NullCell,
  RelCell,
  TsCell,
} from "@/components/manage/cells"
import { DataTable } from "@/components/manage/data-table"
import { ConfirmDelete } from "@/components/manage/confirm-delete"
import { EditMatchSheet } from "@/components/manage/edit-match-sheet"
import { Button } from "@/components/ui/button"
import { useDeleteMatch } from "@/lib/queries/delete-match"
import { friendlyWriteError } from "@/lib/queries/friendly-errors"
import { useManageMatches } from "@/lib/queries/get-manage-matches"
import { usePlayers } from "@/lib/queries/get-players"

import type { ManageColumn } from "@/components/manage/data-table"
import type { ListParams } from "@/lib/queries/manage-list"
import type { MatchRow } from "@/lib/schemas/match"

interface TabProps {
  params: ListParams
  owner: boolean
  onSort: (column: string) => void
  onPage: (page: number) => void
}

export function MatchesTab({ params, owner, onSort, onPage }: TabProps) {
  const matches = useManageMatches(params)
  const del = useDeleteMatch()
  const [editing, setEditing] = useState<MatchRow | null>(null)
  const [deleting, setDeleting] = useState<MatchRow | null>(null)
  const players = usePlayers()
  const nameOf = (id: string) =>
    players.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: Array<ManageColumn<MatchRow>> = [
    {
      key: "match",
      label: "Match",
      render: (m) => (
        <span className="font-medium">
          <RelCell
            tab="players"
            id={m.player1_id}
            label={nameOf(m.player1_id)}
          />{" "}
          vs{" "}
          <RelCell
            tab="players"
            id={m.player2_id}
            label={nameOf(m.player2_id)}
          />
        </span>
      ),
    },
    { key: "date", label: "Date", sortable: true, render: (m) => m.date },
    {
      key: "venue",
      label: "Venue",
      sortable: true,
      render: (m) => m.venue ?? <NullCell />,
    },
    {
      key: "format",
      label: "Format",
      sortable: true,
      render: (m) => (m.format === null ? "Casual" : `Best of ${m.format}`),
    },
    {
      key: "target_score",
      label: "Target",
      sortable: true,
      render: (m) => m.target_score,
    },
    {
      key: "tiebreak",
      label: "Tiebreak",
      render: (m) => <EnumCell value={m.tiebreak} />,
    },
    {
      key: "serves_per_point",
      label: "Serves",
      render: (m) => m.serves_per_point,
    },
    {
      key: "let_resets_serve",
      label: "Let resets",
      render: (m) => <BoolCell value={m.let_resets_serve} />,
    },
    {
      key: "ball_type",
      label: "Ball",
      render: (m) =>
        m.ball_type ? <BallDots ball={m.ball_type} /> : <NullCell />,
    },
    {
      key: "notes",
      label: "Notes",
      render: (m) =>
        m.notes ? (
          <span className="block max-w-48 truncate" title={m.notes}>
            {m.notes}
          </span>
        ) : (
          <NullCell />
        ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (m) => <TsCell iso={m.created_at} />,
    },
    {
      key: "updated_at",
      label: "Updated",
      sortable: true,
      render: (m) => <TsCell iso={m.updated_at} />,
    },
    {
      key: "rel",
      label: "",
      render: (m) => <RelCell tab="games" id={m.id} label="Games" />,
    },
    ...(owner
      ? [
          {
            key: "actions",
            label: "",
            render: (m: MatchRow) => (
              <span className="flex justify-end gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit match"
                  onClick={() => setEditing(m)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete match"
                  onClick={() => setDeleting(m)}
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
        result={matches.data}
        isPending={matches.isPending || matches.isFetching}
        isError={matches.isError}
        onRetry={() => void matches.refetch()}
        pageNumber={params.page}
        sort={params.sort}
        onSort={onSort}
        onPage={onPage}
        rowKey={(m) => m.id}
      />
      {editing && (
        <EditMatchSheet
          match={editing}
          players={players.data ?? []}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDelete
        open={deleting !== null}
        title="Delete this match?"
        description={
          deleting
            ? `${nameOf(deleting.player1_id)} vs ${nameOf(deleting.player2_id)} · ${deleting.date} — deletes the match and all its games and rallies. This can't be undone.`
            : ""
        }
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
