import { EnumCell, NullCell, TsCell } from "@/components/manage/cells"
import { DataTable } from "@/components/manage/data-table"
import { useManagePlayers } from "@/lib/queries/get-manage-players"

import type { ManageColumn } from "@/components/manage/data-table"
import type { ListParams } from "@/lib/queries/manage-list"
import type { PlayerRow } from "@/lib/schemas/player"

interface TabProps {
  params: ListParams
  onSort: (column: string) => void
  onPage: (page: number) => void
}

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
]

export function PlayersTab({ params, onSort, onPage }: TabProps) {
  const players = useManagePlayers(params)
  return (
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
  )
}
