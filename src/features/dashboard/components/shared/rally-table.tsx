import { useState } from "react"

import { RallyDetailSheet } from "@/features/dashboard/components/shared/rally-detail-sheet"
import { humanise } from "@/features/dashboard/lib/humanise"
import { CourtEmptyMedia } from "@/components/court/court-empty"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { RallyScored } from "@/lib/schemas/rally"

// The underlying-rallies table (§5.1, §3.4): the rows behind the number
// above it, straight from a `*_rallies` companion RPC — so the list can never
// disagree with the stat. A row opens the L4 detail sheet; the sheet drills on
// to the match (L3).

export function RallyTable({
  rallies,
  playerId,
}: {
  rallies: Array<RallyScored>
  playerId?: string
}) {
  const [selected, setSelected] = useState<number | null>(null)

  if (rallies.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <CourtEmptyMedia />
          <EmptyTitle className="font-heading">No rallies yet</EmptyTitle>
          <EmptyDescription>
            Rallies behind this stat appear here once there are any to show.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const scoreOf = (r: RallyScored) =>
    playerId && r.player1_id !== playerId
      ? `${r.score_p2}–${r.score_p1}`
      : `${r.score_p1}–${r.score_p2}`

  return (
    <>
      <div className="overflow-x-auto bg-card ring-1 ring-foreground/10">
        <Table>
          {/* condensed tracked heads — the broadcast table's column strap */}
          <TableHeader className="[&_th]:h-9 [&_th]:font-heading [&_th]:text-xs [&_th]:font-bold [&_th]:tracking-[0.12em] [&_th]:text-muted-foreground [&_th]:uppercase">
            <TableRow>
              <TableHead>Game · rally</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Serve</TableHead>
              <TableHead className="text-right">Shots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rallies.map((r, i) => (
              <TableRow
                key={r.id}
                className="cursor-pointer"
                onClick={() => setSelected(i)}
              >
                <TableCell className="tabular-nums">
                  G{r.game_number} · {r.rally_number}
                </TableCell>
                <TableCell className="tabular-nums">{scoreOf(r)}</TableCell>
                <TableCell>
                  {r.is_let ? "Let" : humanise(r.end_reason)}
                </TableCell>
                <TableCell>
                  {humanise(r.serve_side)} · {r.serve_number}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {r.shot_count ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <RallyDetailSheet
        rally={selected === null ? null : rallies[selected]}
        playerId={playerId}
        onClose={() => setSelected(null)}
        onPrev={() => setSelected((i) => (i === null ? i : Math.max(0, i - 1)))}
        onNext={() =>
          setSelected((i) =>
            i === null ? i : Math.min(rallies.length - 1, i + 1)
          )
        }
        hasPrev={selected !== null && selected > 0}
        hasNext={selected !== null && selected < rallies.length - 1}
      />
    </>
  )
}
