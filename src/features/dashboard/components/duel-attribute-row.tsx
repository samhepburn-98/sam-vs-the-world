import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"

// One attribute as a diverging row: the two players' bars grow outward from
// a shared centre label, the higher side at full strength and the lower side
// faded. Bars scale against the row's own maximum, so every row uses its
// full width. An unmeasured value gets no bar and a muted number.

const P1_COLOR = "var(--primary)"
const P2_COLOR = "var(--p2)"
const P2_TEXT = "var(--p2-strong)"

export function DuelAttributeRow({
  a,
  b,
}: {
  a: PlayerAttribute
  b: PlayerAttribute | undefined
}) {
  if (!b) return null
  const v1 = a.value
  const v2 = b.value
  const max = Math.max(v1 ?? 0, v2 ?? 0)
  const width = (v: number | null) =>
    v === null || max === 0 ? 0 : (v / max) * 100
  const p1Wins = v1 !== null && v2 !== null && v1 > v2
  const p2Wins = v1 !== null && v2 !== null && v2 > v1

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-9 shrink-0 text-right text-base font-bold tabular-nums"
        style={{
          color: p1Wins ? P1_COLOR : "var(--muted-foreground)",
        }}
      >
        {a.display}
        <span className="sr-only"> — {a.sr}</span>
      </span>
      <div className="flex min-w-0 flex-1 justify-end">
        <div
          className="h-2 rounded-l-sm"
          style={{
            width: `${width(a.value)}%`,
            backgroundColor: P1_COLOR,
            opacity: p1Wins ? 1 : 0.3,
          }}
        />
      </div>
      <span
        className="text-muted-foreground w-10 shrink-0 text-center text-xs tracking-[0.06em]"
        title={b.detail}
      >
        {a.code}
        <span className="sr-only"> — {a.detail}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="h-2 rounded-r-sm"
          style={{
            width: `${width(b.value)}%`,
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
        {b.display}
        <span className="sr-only"> — {b.sr}</span>
      </span>
    </div>
  )
}
