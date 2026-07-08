import { cn } from "@/lib/utils"

// The tennis-style mirrored stat comparison (§5.2): one row per metric, both
// bars growing out from the centre, the row's larger value at full width and
// the other proportional — the gap between the fills is the story. Values
// wear ink, not the series colour (contrast); the better number is bold with
// an sr-only tag so the cue isn't weight-only.

export interface H2hBarRow {
  label: string
  v1: number
  v2: number
  /** lower is the better number (errors) */
  betterIsLower?: boolean
  /** formatted values; defaults to the raw counts */
  display?: [string, string]
  /** small print under each value, e.g. the raw counts behind a rate */
  detail?: [string, string]
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

function Row({ label, v1, v2, betterIsLower = false, display, detail }: H2hBarRow) {
  const max = Math.max(v1, v2)
  const width = (v: number) => (max === 0 ? 0 : (v / max) * 100)
  const better = v1 === v2 ? null : (v1 < v2) === betterIsLower ? "p1" : "p2"

  return (
    <div>
      <p className="text-muted-foreground mb-1.5 text-center text-xs">
        {label}
      </p>
      <div className="flex items-center gap-2.5">
        <Value
          side="p1"
          text={display?.[0] ?? String(v1)}
          detail={detail?.[0]}
          better={better === "p1"}
        />
        <div className="bg-muted flex h-2.5 flex-1 justify-end overflow-hidden rounded-l-md">
          <div
            className="bg-primary h-full"
            style={{ width: `${width(v1)}%` }}
          />
        </div>
        <div className="w-0.5 shrink-0" />
        <div className="bg-muted h-2.5 flex-1 overflow-hidden rounded-r-md">
          <div
            className="bg-foreground/75 h-full"
            style={{ width: `${width(v2)}%` }}
          />
        </div>
        <Value
          side="p2"
          text={display?.[1] ?? String(v2)}
          detail={detail?.[1]}
          better={better === "p2"}
        />
      </div>
    </div>
  )
}

function Value({
  side,
  text,
  detail,
  better,
}: {
  side: "p1" | "p2"
  text: string
  detail?: string
  better: boolean
}) {
  return (
    <span
      className={cn(
        "flex w-12 shrink-0 flex-col tabular-nums",
        side === "p1" ? "items-end" : "items-start",
      )}
    >
      <span className={cn("text-sm", better && "font-semibold")}>
        {text}
        {better && <span className="sr-only"> (better)</span>}
      </span>
      {detail && (
        <span className="text-muted-foreground text-[10px]">{detail}</span>
      )}
    </span>
  )
}
