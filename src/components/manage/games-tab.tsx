import { RelCell, TsCell } from "@/components/manage/cells"
import { DataTable } from "@/components/manage/data-table"
import { useManageGames } from "@/lib/queries/get-manage-games"
import { usePlayers } from "@/lib/queries/get-players"

import type { ManageColumn } from "@/components/manage/data-table"
import type { ListParams } from "@/lib/queries/manage-list"
import type { GameRowWithMatch } from "@/lib/schemas/game"

interface TabProps {
  params: ListParams
  onSort: (column: string) => void
  onPage: (page: number) => void
}

export function GamesTab({ params, onSort, onPage }: TabProps) {
  const games = useManageGames(params)
  const players = usePlayers()
  const nameOf = (id: string) =>
    players.data?.find((p) => p.id === id)?.name ?? id.slice(0, 8)

  const columns: Array<ManageColumn<GameRowWithMatch>> = [
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
  ]

  return (
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
  )
}
