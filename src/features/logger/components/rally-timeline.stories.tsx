import { useState } from "react"

import { RallyEditor } from "@/components/rally/rally-editor"
import { RallyTimeline } from "@/features/logger/components/rally-timeline"
import { DEFAULT_HOUSE_RULES } from "@/lib/scoring"

import { IDS } from "#storybook/fixtures"

import type { DraftContext, RallyRow } from "@/lib/rally/rally-draft"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ComponentProps } from "react"

// The two-sided rally log: each rally sits on its winner's side with the
// running score down the spine, newest at top. One component serves both the
// logger (click a row to correct it) and match detail (read-only), so a rally
// reads the same wherever it is met. Scores are derived from the rows on every
// render, exactly as the DB views derive them — nothing is stored twice.

type RallyTimelineProps = ComponentProps<typeof RallyTimeline>

const CTX: DraftContext = {
  player1Id: IDS.sam,
  player2Id: IDS.alex,
  rules: DEFAULT_HOUSE_RULES,
}

const rally = (
  overrides: Partial<RallyRow> & { rally_number: number }
): RallyRow => ({
  id: `rally-${overrides.rally_number}`,
  game_id: "game-2",
  server_id: IDS.sam,
  serve_side: "right",
  serve_number: 1,
  winner_id: IDS.sam,
  end_reason: "winner",
  error_detail: null,
  forced: null,
  winning_shot: null,
  losing_shot: null,
  shot_count: null,
  ...overrides,
})

// Six rallies of a real game: a winner, an unforced error, a let that has to
// hold the score, a serve fault, a stroke, and a winner off a boast.
const ROWS: Array<RallyRow> = [
  rally({ rally_number: 1, winning_shot: "drive", shot_count: 3 }),
  rally({
    rally_number: 2,
    serve_side: "left",
    winner_id: IDS.alex,
    end_reason: "error",
    error_detail: "tin",
    forced: false,
    losing_shot: "drop",
    shot_count: 11,
  }),
  rally({
    rally_number: 3,
    server_id: IDS.alex,
    winner_id: null,
    end_reason: "let",
  }),
  rally({
    rally_number: 4,
    server_id: IDS.alex,
    serve_number: 2,
    end_reason: "serve_fault",
    error_detail: "out_side",
    shot_count: 1,
  }),
  rally({
    rally_number: 5,
    winner_id: IDS.alex,
    end_reason: "stroke",
    shot_count: 7,
  }),
  rally({
    rally_number: 6,
    server_id: IDS.alex,
    serve_side: "left",
    winning_shot: "boast",
    shot_count: 5,
  }),
]

/** The editing story holds the rows itself, so a correction really lands and
 *  the spine below it recomputes — the claim the component makes about
 *  derived scores is only worth anything if you can watch it happen. */
function EditableTimeline({ rows: initial, ...props }: RallyTimelineProps) {
  const [rows, setRows] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)
  return (
    <RallyTimeline
      {...props}
      rows={rows}
      editable
      editingId={editingId}
      onRowClick={(row) => setEditingId(row.id)}
      renderEditor={(row) => (
        <RallyEditor
          row={row}
          ctx={CTX}
          p1Name="Sam"
          p2Name="Alex"
          onSave={(edited) => {
            setRows(rows.map((r) => (r.id === edited.id ? edited : r)))
            setEditingId(null)
          }}
          onCancel={() => setEditingId(null)}
        />
      )}
    />
  )
}

const meta = {
  title: "Logger/Rally timeline",
  component: RallyTimeline,
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    rows: ROWS,
    p1Id: IDS.sam,
    p1Name: "Sam",
    p2Name: "Alex",
    servesPerPoint: 2,
  },
} satisfies Meta<typeof RallyTimeline>

export default meta
type Story = StoryObj<typeof meta>

// Read-only, as match detail shows it. The spine wears the rally winner's
// colour, so a run of points is visible at a scroll without reading a word —
// and the let is a neutral hash-mark that visibly doesn't move the score.
export const Default: Story = {}

// The logger's copy: every row is a button. Click one to correct it in place —
// the editor opens where the row was, and saving recomputes every score below
// it, because the running score is derived on each render rather than stored.
export const InTheLogger: Story = {
  name: "In the logger",
  render: (args) => <EditableTimeline {...args} />,
}

// Before the first rally. Not an error state and not a call to action — the
// timeline simply says what will appear here, and gets out of the way.
export const NoRalliesYet: Story = {
  name: "No rallies yet",
  args: { rows: [] },
}
