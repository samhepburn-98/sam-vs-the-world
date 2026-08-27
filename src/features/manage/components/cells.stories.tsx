import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BoolCell,
  EnumCell,
  NullCell,
  RelCell,
  TsCell,
} from "@/features/manage/components/cells"

import { withRouter } from "#storybook/decorators"
import { ALEX, IDS, SAM } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The five ways /manage prints a stored value: a relation you can follow, a
// raw enum made readable, a boolean, a null, and a timestamp. Reach for them
// anywhere the database row itself is on screen — they keep it raw enough to
// trust and readable enough to scan, and they never invent a value the row
// does not have.

const GAME_ID = "55555555-5555-4555-8555-555555555555"

// Every stored enum the rallies tab prints, exactly as Postgres holds it.
const STORED_ENUMS = [
  "win_by_2",
  "sudden_death",
  "double_yellow",
  "serve_fault",
  "out_back",
  "not_up",
]

const meta = {
  title: "Manage/Cells",
  component: RelCell,
  decorators: [withRouter],
  args: { tab: "players", id: ALEX.id, label: ALEX.name },
} satisfies Meta<typeof RelCell>

export default meta
type Story = StoryObj<typeof meta>

// Four rallies as the rallies tab renders them, and the whole vocabulary in
// one table. Watch the Forced column: it reads false on the unforced error,
// true on the forced one, and a faded dash on the winner and the let, because
// forced only means anything on an error. Null is not false — the row admits
// the column doesn't apply rather than printing a confident "No".
export const Default: Story = {
  render: () => (
    <div className="max-w-4xl rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Game</TableHead>
            <TableHead>Rally #</TableHead>
            <TableHead>Server</TableHead>
            <TableHead>Winner</TableHead>
            <TableHead>End reason</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead>Forced</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <RelCell
                tab="games"
                id={GAME_ID}
                label={`G2 · ${SAM.name} vs ${ALEX.name} · 2026-08-14`}
              />
            </TableCell>
            <TableCell>11</TableCell>
            <TableCell>
              <RelCell tab="players" id={SAM.id} label={SAM.name} />
            </TableCell>
            <TableCell>
              <RelCell tab="players" id={SAM.id} label={SAM.name} />
            </TableCell>
            <TableCell>
              <EnumCell value="winner" />
            </TableCell>
            <TableCell>
              <NullCell />
            </TableCell>
            <TableCell>
              <BoolCell value={null} />
            </TableCell>
            <TableCell>
              <TsCell iso="2026-08-14T20:31:08.412Z" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <RelCell
                tab="games"
                id={GAME_ID}
                label={`G2 · ${SAM.name} vs ${ALEX.name} · 2026-08-14`}
              />
            </TableCell>
            <TableCell>12</TableCell>
            <TableCell>
              <RelCell tab="players" id={ALEX.id} label={ALEX.name} />
            </TableCell>
            <TableCell>
              <RelCell tab="players" id={SAM.id} label={SAM.name} />
            </TableCell>
            <TableCell>
              <EnumCell value="error" />
            </TableCell>
            <TableCell>
              <EnumCell value="out_back" />
            </TableCell>
            <TableCell>
              <BoolCell value={false} />
            </TableCell>
            <TableCell>
              <TsCell iso="2026-08-14T20:32:44.108Z" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <RelCell
                tab="games"
                id={GAME_ID}
                label={`G2 · ${SAM.name} vs ${ALEX.name} · 2026-08-14`}
              />
            </TableCell>
            <TableCell>13</TableCell>
            <TableCell>
              <RelCell tab="players" id={SAM.id} label={SAM.name} />
            </TableCell>
            <TableCell>
              <RelCell tab="players" id={ALEX.id} label={ALEX.name} />
            </TableCell>
            <TableCell>
              <EnumCell value="error" />
            </TableCell>
            <TableCell>
              <EnumCell value="not_up" />
            </TableCell>
            <TableCell>
              <BoolCell value />
            </TableCell>
            <TableCell>
              <TsCell iso="2026-08-14T20:33:19.677Z" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <RelCell
                tab="games"
                id={GAME_ID}
                label={`G2 · ${SAM.name} vs ${ALEX.name} · 2026-08-14`}
              />
            </TableCell>
            <TableCell>14</TableCell>
            <TableCell>
              <RelCell tab="players" id={ALEX.id} label={ALEX.name} />
            </TableCell>
            <TableCell>
              <NullCell />
            </TableCell>
            <TableCell>
              <EnumCell value="let" />
            </TableCell>
            <TableCell>
              <NullCell />
            </TableCell>
            <TableCell>
              <BoolCell value={null} />
            </TableCell>
            <TableCell>
              <TsCell iso="2026-08-14T20:34:02.315Z" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
}

// A foreign key you can walk. The link pastes the id into the target tab's
// search box, so following one lands on that row's children already filtered
// — the match's games, the game's rallies, the player's own row. Hover any of
// them for the full uuid.
export const RelationLinks: Story = {
  name: "Relation links",
  render: () => (
    <div className="flex flex-col items-start gap-2 text-sm">
      <RelCell
        tab="matches"
        id={IDS.match}
        label={`${SAM.name} vs ${ALEX.name} · 2026-08-14`}
      />
      <RelCell tab="games" id={IDS.match} label="Games" />
      <RelCell tab="rallies" id={GAME_ID} label="Rallies" />
      <RelCell tab="players" id={SAM.id} label={SAM.name} />
    </div>
  ),
}

// Stored enums, humanised. The database value is on the left and what the
// table prints is on the right: underscores out, first letter up, nothing
// else touched — so a value nobody has written a label for still reads.
export const StoredEnums: Story = {
  name: "Stored enums",
  render: () => (
    <div className="grid max-w-md grid-cols-[10rem_1fr] gap-x-6 gap-y-2 text-sm">
      {STORED_ENUMS.map((value) => (
        <div key={value} className="contents">
          <span className="font-mono text-xs text-muted-foreground">
            {value}
          </span>
          <span>
            <EnumCell value={value} />
          </span>
        </div>
      ))}
    </div>
  ),
}
