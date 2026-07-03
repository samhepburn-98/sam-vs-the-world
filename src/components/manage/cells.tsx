import { Link } from "@tanstack/react-router"

// Cell primitives shared by the manage tabs (§5.4): raw-but-readable —
// truncated monospace ids with the full value on hover, relation links that
// hop tabs by pasting the id into that tab's search.

export type ManageTab = "matches" | "games" | "rallies" | "players"

export function IdCell({ id }: { id: string }) {
  return (
    <span className="text-muted-foreground font-mono text-[11px]" title={id}>
      {id.slice(0, 8)}
    </span>
  )
}

/** A clickable relation: opens the target tab filtered to the given id. */
export function RelCell({
  tab,
  id,
  label,
}: {
  tab: ManageTab
  id: string
  label: React.ReactNode
}) {
  return (
    <Link
      to="/manage"
      search={{ tab, q: id, page: 1, sort: "", dir: "desc" }}
      title={id}
      className="text-primary underline-offset-2 hover:underline"
    >
      {label}
    </Link>
  )
}

export function BoolCell({ value }: { value: boolean | null }) {
  if (value === null) return <NullCell />
  return <span aria-label={String(value)}>{value ? "✓" : "✗"}</span>
}

export function NullCell() {
  return <span className="text-muted-foreground/50">—</span>
}

/** Compact timestamp: date + minutes, no timezone noise. */
export function TsCell({ iso }: { iso: string }) {
  return (
    <span className="text-muted-foreground tabular-nums" title={iso}>
      {iso.slice(0, 16).replace("T", " ")}
    </span>
  )
}
