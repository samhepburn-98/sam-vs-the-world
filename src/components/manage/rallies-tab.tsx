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
    { key: "id", label: "id", render: (r) => <IdCell id={r.id} /> },
    {
      key: "game_id",
      label: "game",
      render: (r) => (
        <RelCell tab="games" id={r.game_id} label={r.game_id.slice(0, 8)} />
      ),
    },
    {
      key: "rally_number",
      label: "rally #",
      sortable: true,
      render: (r) => r.rally_number,
    },
    {
      key: "server_id",
      label: "server",
      render: (r) => (
        <RelCell tab="players" id={r.server_id} label={nameOf(r.server_id)} />
      ),
    },
    { key: "serve_side", label: "box", render: (r) => r.serve_side },
    {
      key: "serve_number",
      label: "serve",
      sortable: true,
      render: (r) => r.serve_number,
    },
    {
      key: "winner_id",
      label: "winner",
      render: (r) =>
        r.winner_id ? (
          <RelCell tab="players" id={r.winner_id} label={nameOf(r.winner_id)} />
        ) : (
          <NullCell />
        ),
    },
    {
      key: "end_reason",
      label: "end reason",
      sortable: true,
      render: (r) => r.end_reason.replace("_", " "),
    },
    {
      key: "error_detail",
      label: "detail",
      render: (r) => r.error_detail?.replace("_", " ") ?? <NullCell />,
    },
    {
      key: "forced",
      label: "forced",
      render: (r) => <BoolCell value={r.forced} />,
    },
    {
      key: "shot_type",
      label: "shot",
      render: (r) => r.shot_type ?? <NullCell />,
    },
    {
      key: "shot_count",
      label: "shots",
      sortable: true,
      render: (r) => r.shot_count ?? <NullCell />,
    },
    {
      key: "created_at",
      label: "created",
      sortable: true,
      render: (r) => <TsCell iso={r.created_at} />,
    },
    {
      key: "updated_at",
      label: "updated",
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
