import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"

// One attribute as a diverging row: the two players' bars grow outward from
// a shared centre label, the higher side at full strength and the lower side
// faded. Bars scale against the row's own maximum, so every row uses its
// full width. An unmeasured value gets no bar and a muted number.

const P1_COLOR = "var(--primary)"
const P2_COLOR = "var(--p2)"
const P2_TEXT = "var(--p2-strong)"

export function DuelAttributeRow({
  p1Attr,
  p2Attr,
}: {
  p1Attr: PlayerAttribute
  p2Attr: PlayerAttribute | undefined
}) {
  if (!p2Attr) return null
  const p1Value = p1Attr.value
  const p2Value = p2Attr.value
  const max = Math.max(p1Value ?? 0, p2Value ?? 0)
  const width = (v: number | null) =>
    v === null || max === 0 ? 0 : (v / max) * 100
  const p1Wins = p1Value !== null && p2Value !== null && p1Value > p2Value
  const p2Wins = p1Value !== null && p2Value !== null && p2Value > p1Value

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-9 shrink-0 text-right text-base font-bold tabular-nums"
        style={{
          color: p1Wins ? P1_COLOR : "var(--muted-foreground)",
        }}
      >
        {p1Attr.display}
        <span className="sr-only"> — {p1Attr.sr}</span>
      </span>
      <div className="flex min-w-0 flex-1 justify-end">
        <div
          className="h-2 rounded-l-sm"
          style={{
            width: `${width(p1Attr.value)}%`,
            backgroundColor: P1_COLOR,
            opacity: p1Wins ? 1 : 0.3,
          }}
        />
      </div>
      <span
        className="w-10 shrink-0 text-center text-xs tracking-[0.06em] text-muted-foreground"
        title={p2Attr.detail}
      >
        {p1Attr.code}
        <span className="sr-only"> — {p1Attr.detail}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="h-2 rounded-r-sm"
          style={{
            width: `${width(p2Attr.value)}%`,
            backgroundColor: P2_COLOR,
            opacity: p2Wins ? 1 : 0.3,
          }}
        />
      </div>
      <span
        className="w-9 shrink-0 text-base font-bold tabular-nums"
        style={{
          color: p2Wins ? P2_TEXT : "var(--muted-foreground)",
        }}
      >
        {p2Attr.display}
        <span className="sr-only"> — {p2Attr.sr}</span>
      </span>
    </div>
  )
}
