import {
  BoolCell,
  IdCell,
  NullCell,
  RelCell,
  TsCell,
} from "@/components/manage/cells"
import { DataTable } from "@/components/manage/data-table"
import { useManageRallies } from "@/lib/queries/get-manage-rallies"
import { usePlayers } from "@/lib/queries/get-players"

import type { ManageColumn } from "@/components/manage/data-table"
import type { ListParams } from "@/lib/queries/manage-list"
import type { RallyDbRow } from "@/lib/schemas/rally"

interface TabProps {
  params: ListParams
  onSort: (column: string) => void
  onPage: (page: number) => void
}

export function RalliesTab({ params, onSort, onPage }: TabProps) {
  const rallies = useManageRallies(params)
  const players = usePlayers()
  const nameOf = (id: string) =>
    players.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: Array<ManageColumn<RallyDbRow>> = [
    { key: "id", label: "ID", render: (r) => <IdCell id={r.id} /> },
    {
      key: "game_id",
      label: "Game",
      render: (r) => (
        <RelCell tab="games" id={r.game_id} label={r.game_id.slice(0, 8)} />
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
    { key: "serve_side", label: "Box", render: (r) => r.serve_side },
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
      render: (r) => r.end_reason.replace("_", " "),
    },
    {
      key: "error_detail",
      label: "Detail",
      render: (r) => r.error_detail?.replace("_", " ") ?? <NullCell />,
    },
    {
      key: "forced",
      label: "Forced",
      render: (r) => <BoolCell value={r.forced} />,
    },
    {
      key: "shot_type",
      label: "Shot",
      render: (r) => r.shot_type ?? <NullCell />,
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
  ]

  return (
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
  )
}
