import {
  MIN_GAMES_FOR_WIN_RATE,
  MIN_RALLIES_FOR_RATE,
} from "@/features/dashboard/utils/insight-thresholds"
import { cn } from "@/lib/utils"

import type {
  ErrorProfile,
  Momentum,
  PlayerHeadline,
  RallyLengths,
  ServeStats,
} from "@/features/dashboard/schemas/insights"

// The two-player head-to-head showcase (§5.1) — a FIFA-style contest rather
// than a table: each player owns a colour, headline rates are rings, and every
// stat is an opposed bar growing from the centre toward whoever leads.

export interface PlayerData {
  headline?: PlayerHeadline
  serve?: ServeStats
  error?: ErrorProfile
  rally?: RallyLengths
  momentum?: Momentum
}

const P1_COLOR = "var(--primary)" // orange accent — themed, AA in both modes
const P2_COLOR = "var(--p2)" // blue fill for bars & rings (graphical)
const P2_TEXT = "var(--p2-strong)" // blue for small text — AA-tuned per theme

interface Cell {
  value: number | null // null → not enough data (no bar)
  display: string
}

function rate(won: number, of: number, min: number): Cell {
  if (of < min) return { value: null, display: `n=${of}` }
  return { value: Math.round((won / of) * 100), display: `${Math.round((won / of) * 100)}%` }
}

function count(n: number, suffix = ""): Cell {
  return { value: n, display: `${n}${suffix}` }
}

function ratio(num: number, den: number, min: number): Cell {
  if (den < min) return { value: null, display: `n=${den}` }
  return { value: num / den, display: (num / den).toFixed(1) }
}

// ---- radial gauge ---------------------------------------------------------
function Ring({
  cell,
  label,
  color,
}: {
  cell: Cell
  label: string
  color: string
}) {
  const R = 42
  const C = 2 * Math.PI * R
  const pct = cell.value ?? 0
  const dash = (Math.max(0, Math.min(100, pct)) / 100) * C
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative size-20 sm:size-24">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx={50} cy={50} r={R} fill="none" stroke="var(--muted)" strokeWidth={8} />
          {cell.value !== null && (
            <circle
              cx={50}
              cy={50}
              r={R}
              fill="none"
              stroke={color}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
            />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">
          {cell.value === null ? "—" : `${cell.value}%`}
        </span>
      </div>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

// ---- opposed stat row -----------------------------------------------------
function OpposedStat({
  label,
  left,
  right,
  betterWhen,
}: {
  label: string
  left: Cell
  right: Cell
  betterWhen: "higher" | "lower" | "neither"
}) {
  const lv = left.value ?? 0
  const rv = right.value ?? 0
  const total = lv + rv
  const ls = total > 0 ? lv / total : 0.5
  const rs = total > 0 ? rv / total : 0.5

  let leftWins = false
  let rightWins = false
  if (left.value !== null && right.value !== null && betterWhen !== "neither") {
    const higher = left.value > right.value
    const lower = left.value < right.value
    leftWins = betterWhen === "higher" ? higher : lower
    rightWins = betterWhen === "higher" ? !higher && left.value !== right.value : !lower && left.value !== right.value
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-center text-xs">{label}</p>
      <div className="flex items-center gap-3">
        <span
          className={cn("w-16 text-right text-sm tabular-nums", leftWins && "font-bold")}
          style={leftWins ? { color: P1_COLOR } : undefined}
        >
          {left.display}
        </span>
        <div className="flex flex-1 items-center">
          <div className="flex flex-1 justify-end">
            <div
              className="h-2 rounded-l-full"
              style={{ width: `${ls * 100}%`, backgroundColor: P1_COLOR }}
            />
          </div>
          <div className="flex flex-1 justify-start">
            <div
              className="h-2 rounded-r-full"
              style={{ width: `${rs * 100}%`, backgroundColor: P2_COLOR }}
            />
          </div>
        </div>
        <span
          className={cn("w-16 text-sm tabular-nums", rightWins && "font-bold")}
          style={rightWins ? { color: P2_TEXT } : undefined}
        >
          {right.display}
        </span>
      </div>
    </div>
  )
}

export function CompareShowcase({
  name1,
  name2,
  d1,
  d2,
}: {
  name1: string
  name2: string
  d1: PlayerData
  d2: PlayerData
}) {
  const winRate = (d: PlayerData) =>
    d.headline
      ? rate(d.headline.games_won, d.headline.games_decided, MIN_GAMES_FOR_WIN_RATE)
      : { value: null, display: "—" }
  const serveRate = (d: PlayerData) =>
    d.serve
      ? rate(d.serve.serve_wins, d.serve.rallies_served, MIN_RALLIES_FOR_RATE)
      : { value: null, display: "—" }

  const returnRate = (d: PlayerData) =>
    d.serve
      ? rate(d.serve.return_wins, d.serve.rallies_returned, MIN_RALLIES_FOR_RATE)
      : { value: null, display: "—" }

  // the rings already carry win rate and serve win rate — the bars cover
  // everything else so nothing is shown twice
  const rows: Array<{
    label: string
    left: Cell
    right: Cell
    betterWhen: "higher" | "lower" | "neither"
  }> = [
    {
      label: "Games won",
      left: count(d1.headline?.games_won ?? 0),
      right: count(d2.headline?.games_won ?? 0),
      betterWhen: "higher",
    },
    {
      label: "Matches won",
      left: count(d1.headline?.matches_won ?? 0),
      right: count(d2.headline?.matches_won ?? 0),
      betterWhen: "higher",
    },
    {
      label: "Return win rate",
      left: returnRate(d1),
      right: returnRate(d2),
      betterWhen: "higher",
    },
    {
      label: "Aces",
      left: count(d1.serve?.aces ?? 0),
      right: count(d2.serve?.aces ?? 0),
      betterWhen: "higher",
    },
    {
      label: "Double faults",
      left: count(d1.serve?.double_faults ?? 0),
      right: count(d2.serve?.double_faults ?? 0),
      betterWhen: "lower",
    },
    {
      label: "Unforced / game",
      left: d1.error ? ratio(d1.error.unforced_errors, d1.error.games_played, MIN_GAMES_FOR_WIN_RATE) : { value: null, display: "—" },
      right: d2.error ? ratio(d2.error.unforced_errors, d2.error.games_played, MIN_GAMES_FOR_WIN_RATE) : { value: null, display: "—" },
      betterWhen: "lower",
    },
    {
      label: "Avg rally length",
      left: { value: d1.rally?.avg_length ?? null, display: d1.rally?.avg_length?.toFixed(1) ?? "—" },
      right: { value: d2.rally?.avg_length ?? null, display: d2.rally?.avg_length?.toFixed(1) ?? "—" },
      betterWhen: "neither",
    },
    {
      label: "Comebacks",
      left: count(d1.momentum?.comebacks ?? 0),
      right: count(d2.momentum?.comebacks ?? 0),
      betterWhen: "higher",
    },
    {
      label: "Longest win streak",
      left: count(d1.momentum?.longest_streak ?? 0),
      right: count(d2.momentum?.longest_streak ?? 0),
      betterWhen: "higher",
    },
  ]

  return (
    <div className="flex flex-col gap-6 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      {/* header */}
      <div className="flex items-center justify-center gap-4 text-xl font-bold">
        <span className="font-heading" style={{ color: P1_COLOR }}>
          {name1}
        </span>
        <span className="text-muted-foreground text-sm font-normal">vs</span>
        <span className="font-heading" style={{ color: P2_COLOR }}>
          {name2}
        </span>
      </div>

      {/* rings */}
      <div className="flex items-start justify-center gap-3 sm:gap-10">
        <div className="flex gap-2 sm:gap-4">
          <Ring cell={winRate(d1)} label="Win rate" color={P1_COLOR} />
          <Ring cell={serveRate(d1)} label="Serve" color={P1_COLOR} />
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Ring cell={serveRate(d2)} label="Serve" color={P2_COLOR} />
          <Ring cell={winRate(d2)} label="Win rate" color={P2_COLOR} />
        </div>
      </div>

      {/* opposed rows */}
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <OpposedStat key={r.label} {...r} />
        ))}
      </div>
    </div>
  )
}
