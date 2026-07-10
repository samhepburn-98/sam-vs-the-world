import { cn } from "@/lib/utils"

import type { H2hRow } from "@/features/dashboard/lib/profile-fixture"

// Head-to-head per rival: the match and game records as numbers, the games
// share as a bar so the balance of each rivalry reads without arithmetic,
// and the last result as the "right now" signal.

export function H2hTable({ rows }: { rows: Array<H2hRow> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            <th className="py-2 pr-3 font-medium">Rival</th>
            <th className="py-2 pr-3 text-right font-medium">Matches</th>
            <th className="py-2 pr-3 text-right font-medium">Games</th>
            <th className="w-2/5 py-2 pr-3 font-medium">Share</th>
            <th className="py-2 font-medium">Last</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rival} className="border-b last:border-b-0">
              <td className="py-2.5 pr-3 font-medium">{row.rival}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums">
                {row.matches}
              </td>
              <td className="py-2.5 pr-3 text-right tabular-nums">
                {row.games}
              </td>
              <td className="py-2.5 pr-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500/80"
                    style={{ width: `${row.share}%` }}
                  />
                </div>
              </td>
              <td className="py-2.5">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-md text-xs font-bold",
                    row.lastWon
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-red-500/15 text-red-500"
                  )}
                >
                  {row.lastWon ? "W" : "L"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
