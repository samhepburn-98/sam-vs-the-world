import { cn } from "@/lib/utils"

// The tennis-style mirrored stat comparison (§5.2): one row per metric, both
// bars growing out from the centre, the row's larger value at full width and
// the other proportional — the gap between the fills is the story. Values
// wear ink, not the series colour (contrast); the better number is bold and
// the other muted, so the call reads without a legend, with an sr-only tag
// so it isn't weight-only.

export interface H2hBarRow {
  label: string
  v1: number
  v2: number
  /** lower is the better number (errors) */
  betterIsLower?: boolean
  /** formatted values; defaults to the raw counts */
  display?: [string, string]
  /** screen-reader-only detail, e.g. the raw counts behind a rate */
  sr?: [string, string]
}

export function H2hBars({ rows }: { rows: Array<H2hBarRow> }) {
  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <Row key={row.label} {...row} />
      ))}
    </div>
  )
}

function Row({ label, v1, v2, betterIsLower = false, display, sr }: H2hBarRow) {
  const max = Math.max(v1, v2)
  const width = (v: number) => (max === 0 ? 0 : (v / max) * 100)
  const better = v1 === v2 ? null : v1 < v2 === betterIsLower ? "p1" : "p2"

  return (
    <div>
      <p className="mb-1.5 text-center text-xs text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-2.5">
        <Value
          side="p1"
          text={display?.[0] ?? String(v1)}
          sr={sr?.[0]}
          state={
            better === null ? "tied" : better === "p1" ? "better" : "worse"
          }
        />
        <div className="flex h-2.5 flex-1 justify-end overflow-hidden rounded-l-md bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${width(v1)}%` }}
          />
        </div>
        <div className="w-0.5 shrink-0" />
        <div className="h-2.5 flex-1 overflow-hidden rounded-r-md bg-muted">
          <div
            className="h-full bg-foreground/75"
            style={{ width: `${width(v2)}%` }}
          />
        </div>
        <Value
          side="p2"
          text={display?.[1] ?? String(v2)}
          sr={sr?.[1]}
          state={
            better === null ? "tied" : better === "p2" ? "better" : "worse"
          }
        />
      </div>
    </div>
  )
}

function Value({
  side,
  text,
  sr,
  state,
}: {
  side: "p1" | "p2"
  text: string
  sr?: string
  state: "better" | "worse" | "tied"
}) {
  return (
    <span
      className={cn(
        "w-14 shrink-0 text-base tabular-nums",
        side === "p1" ? "text-right" : "text-left",
        state === "better" && "font-semibold",
        state === "worse" && "text-muted-foreground"
      )}
    >
      {text}
      {state === "better" && <span className="sr-only"> (better)</span>}
      {sr && <span className="sr-only"> ({sr})</span>}
    </span>
  )
}
