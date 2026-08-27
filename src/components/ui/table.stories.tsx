import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The plain data table behind the receipts — the rallies under a stat, the
// rows on the manage screen. It handles the shell only: scrolling, rules,
// row hover and the selected row. Emptiness is the caller's job, so a list
// that can arrive empty pairs it with an <Empty> state, as RallyTable does.

const meta = {
  title: "Primitives/Table",
  component: Table,
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const RALLIES = [
  {
    id: "1",
    at: "G1 · 4",
    score: "3–1",
    outcome: "Winner",
    serve: "Right · 1",
    shots: "7",
  },
  {
    id: "2",
    at: "G1 · 5",
    score: "3–2",
    outcome: "Error",
    serve: "Left · 2",
    shots: "4",
  },
  {
    id: "3",
    at: "G1 · 6",
    score: "4–2",
    outcome: "Stroke",
    serve: "Right · 1",
    shots: "11",
  },
  // An older rally logged score-only: no shot count, so the cell shows a dash
  // rather than a zero — the number is unknown, not none.
  {
    id: "4",
    at: "G1 · 7",
    score: "4–3",
    outcome: "Let",
    serve: "Left · 1",
    shots: "—",
  },
  {
    id: "5",
    at: "G2 · 1",
    score: "0–0",
    outcome: "Ace",
    serve: "Right · 1",
    shots: "1",
  },
]

export const Default: Story = {
  render: () => (
    <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Game · rally</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead>Serve</TableHead>
            <TableHead className="text-right">Shots</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RALLIES.map((rally) => (
            <TableRow key={rally.id}>
              <TableCell className="tabular-nums">{rally.at}</TableCell>
              <TableCell className="tabular-nums">{rally.score}</TableCell>
              <TableCell>{rally.outcome}</TableCell>
              <TableCell>{rally.serve}</TableCell>
              <TableCell className="text-right tabular-nums">
                {rally.shots}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}

// `data-state="selected"` holds a row lit while whatever it opened is still
// open — a rally's detail sheet, say — so the reader keeps their place when
// that thing closes. Pair it with `cursor-pointer` on any row that opens
// something, which is the part RallyTable already does.
export const SelectedRow: Story = {
  render: () => (
    <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Game · rally</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Outcome</TableHead>
            <TableHead className="text-right">Shots</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {RALLIES.map((rally) => (
            <TableRow
              key={rally.id}
              className="cursor-pointer"
              data-state={rally.id === "3" ? "selected" : undefined}
            >
              <TableCell className="tabular-nums">{rally.at}</TableCell>
              <TableCell className="tabular-nums">{rally.score}</TableCell>
              <TableCell>{rally.outcome}</TableCell>
              <TableCell className="text-right tabular-nums">
                {rally.shots}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
}

// Footer and caption: the totals row carries the denominators the rates were
// read from, and the caption says what the table counts, which keeps the
// numbers honest without a paragraph above them.
export const WithTotals: Story = {
  render: () => (
    <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <Table>
        <TableCaption>
          Matches played since 14 July 2026. A win rate needs five decided games
          before it is shown.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Opponent</TableHead>
            <TableHead className="text-right">Played</TableHead>
            <TableHead className="text-right">Won</TableHead>
            <TableHead className="text-right">Games</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alex</TableCell>
            <TableCell className="text-right tabular-nums">5</TableCell>
            <TableCell className="text-right tabular-nums">1</TableCell>
            <TableCell className="text-right tabular-nums">6–14</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Ormond</TableCell>
            <TableCell className="text-right tabular-nums">3</TableCell>
            <TableCell className="text-right tabular-nums">2</TableCell>
            <TableCell className="text-right tabular-nums">7–5</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell className="text-right tabular-nums">8</TableCell>
            <TableCell className="text-right tabular-nums">3</TableCell>
            <TableCell className="text-right tabular-nums">13–19</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
}
