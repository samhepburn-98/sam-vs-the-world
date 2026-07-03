import { BallDots } from "@/components/ball-dots"
import {
  BoolCell,
  NullCell,
  RelCell,
  TsCell,
} from "@/components/manage/cells"
import { DataTable } from "@/components/manage/data-table"
import { useManageMatches } from "@/lib/queries/get-manage-matches"
import { usePlayers } from "@/lib/queries/get-players"

import type { ManageColumn } from "@/components/manage/data-table"
import type { ListParams } from "@/lib/queries/manage-list"
import type { MatchRow } from "@/lib/schemas/match"

interface TabProps {
  params: ListParams
  onSort: (column: string) => void
  onPage: (page: number) => void
}

export function MatchesTab({ params, onSort, onPage }: TabProps) {
  const matches = useManageMatches(params)
  const players = usePlayers()
  const nameOf = (id: string) =>
    players.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: Array<ManageColumn<MatchRow>> = [
    { key: "date", label: "Date", sortable: true, render: (m) => m.date },
    {
      key: "player1_id",
      label: "Player 1",
      render: (m) => (
        <RelCell tab="players" id={m.player1_id} label={nameOf(m.player1_id)} />
      ),
    },
    {
      key: "player2_id",
      label: "Player 2",
      render: (m) => (
        <RelCell tab="players" id={m.player2_id} label={nameOf(m.player2_id)} />
      ),
    },
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
      render: (m) => (m.format === null ? <NullCell /> : `best of ${m.format}`),
    },
    {
      key: "target_score",
      label: "Target",
      sortable: true,
      render: (m) => m.target_score,
    },
    { key: "tiebreak", label: "Tiebreak", render: (m) => m.tiebreak },
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
  ]

  return (
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
  )
}
