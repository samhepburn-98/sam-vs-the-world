import { MANAGE_PAGE_SIZE } from "@/features/manage/api/manage-list"
import {
  BoolCell,
  EnumCell,
  NullCell,
  TsCell,
} from "@/features/manage/components/cells"
import { DataTable } from "@/features/manage/components/data-table"

import { ALEX, ORMOND, SAM } from "#storybook/fixtures"

import type { ManageColumn } from "@/features/manage/components/data-table"
import type { MatchRow } from "@/lib/schemas/match"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The shell every /manage tab is poured into: sortable headers, one fixed
// page of 25 stored rows, and a pager that counts from the server's total.
// Reach for it when a screen shows rows as they are stored rather than
// numbers derived from them — the columns, and everything inside a cell,
// belong to the caller. It owns the four states a fetch can be in.

const NAME_OF: Record<string, string> = {
  [SAM.id]: SAM.name,
  [ALEX.id]: ALEX.name,
  [ORMOND.id]: ORMOND.name,
}

const matchId = (n: number) =>
  `44444444-4444-4444-8444-${String(n).padStart(12, "0")}`

// A page of the matches tab: every column the stored row has, nulls left as
// nulls, casual sessions mixed in with best-of-fives.
const PAGE: Array<MatchRow> = Array.from(
  { length: MANAGE_PAGE_SIZE },
  (_, i) => {
    const date = `2026-08-${String(26 - i).padStart(2, "0")}`
    return {
      id: matchId(i + 1),
      date,
      player1_id: SAM.id,
      player2_id: i % 2 === 0 ? ALEX.id : ORMOND.id,
      venue: i % 4 === 3 ? null : "Ormond Leisure Centre",
      format: i % 3 === 0 ? null : 5,
      target_score: i % 7 === 0 ? 15 : 11,
      tiebreak: i % 5 === 0 ? "sudden_death" : "win_by_2",
      serves_per_point: 2,
      let_resets_serve: i % 3 !== 1,
      ball_type: "double_yellow",
      notes: null,
      created_at: `${date}T20:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
      updated_at: `${date}T21:${String((i * 5) % 60).padStart(2, "0")}:00Z`,
    }
  }
)

const COLUMNS: Array<ManageColumn<MatchRow>> = [
  {
    key: "match",
    label: "Match",
    render: (m) => (
      <span className="font-medium">
        {NAME_OF[m.player1_id]} vs {NAME_OF[m.player2_id]}
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
    key: "let_resets_serve",
    label: "Let resets",
    render: (m) => <BoolCell value={m.let_resets_serve} />,
  },
  {
    key: "created_at",
    label: "Created",
    sortable: true,
    render: (m) => <TsCell iso={m.created_at} />,
  },
]

const meta = {
  title: "Manage/Data table",
  component: DataTable,
  args: {
    columns: COLUMNS,
    result: { rows: PAGE, total: 63 },
    isPending: false,
    isError: false,
    pageNumber: 1,
    sort: { column: "date", dir: "desc" },
    rowKey: (m: MatchRow) => m.id,
    onSort: () => undefined,
    onPage: () => undefined,
    onRetry: () => undefined,
  },
} satisfies Meta<typeof DataTable<MatchRow>>

export default meta
type Story = StoryObj<typeof meta>

// Page one of 63 matches, newest first. The sorted header carries the arrow;
// the others only show their handle on hover, so a wide table of raw columns
// stays quiet until you go looking. Prev is disabled because there is nothing
// behind page one.
export const Default: Story = {}

// The first fetch, with nothing to show yet: skeleton rows in the real column
// widths, so the table arrives at the size it will keep instead of jumping.
export const LoadingTheFirstPage: Story = {
  name: "Loading the first page",
  args: { result: undefined, isPending: true },
}

// Paging or re-sorting keeps the previous page on screen and dims it while
// the next one loads. The rows you were reading stay put, and the pager has
// already moved to where you are going.
export const RefreshingAStalePage: Story = {
  name: "Refreshing a stale page",
  args: { isPending: true, pageNumber: 2 },
}

// The search box narrowed it to nothing. The table keeps its headers and says
// so in a row of its own — the shape of the screen never collapses under you.
export const NoRecordsMatch: Story = {
  name: "No records match",
  args: { result: { rows: [], total: 0 } },
}

// The fetch failed. An inline card with a retry, not a toast that scrolls
// away: the tab is unusable until the fetch succeeds, so the fix lives where
// the rows would have been.
export const FailedToLoad: Story = {
  name: "Failed to load",
  args: { result: undefined, isError: true },
}
