import { CheckIcon, Share2Icon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

import type { DuelAttribute } from "@/features/dashboard/lib/duel-attributes"

// The centre column of the duel (§5.1 redesign): score, dominance split,
// the six attributes as diverging rows, the stats verdict, the receipts
// table of raw counts, and the share button. Player one is always the left
// side in orange; player two the right in blue — same convention as the
// cards flanking it.

const P1_COLOR = "var(--primary)"
const P2_COLOR = "var(--p2)"
const P2_TEXT = "var(--p2-strong)"

export interface DuelReceipt {
  label: string
  v1: string
  v2: string
}

export function DuelCenter({
  name1,
  name2,
  score,
  dominance,
  attrs1,
  attrs2,
  tally,
  receipts,
}: {
  name1: string
  name2: string
  score: { p1: number; p2: number; heading: string; caption: string }
  /** player one's share, 0–1 — null hides the bar (not enough data) */
  dominance: number | null
  attrs1: Array<DuelAttribute>
  attrs2: Array<DuelAttribute>
  tally: { p1: number; p2: number }
  receipts: Array<DuelReceipt>
}) {
  const leader =
    tally.p1 === tally.p2 ? null : tally.p1 > tally.p2 ? name1 : name2
  const tallyLine =
    tally.p1 === tally.p2
      ? `all square at ${tally.p1}–${tally.p2} across the six`
      : `takes it ${Math.max(tally.p1, tally.p2)}–${Math.min(tally.p1, tally.p2)} across the six`

  return (
    <div className="flex flex-col">
      <div className="text-center">
        <p className="text-muted-foreground text-[9px] tracking-[0.2em] uppercase">
          {score.heading}
        </p>
        <p className="mt-0.5 text-4xl leading-none font-extrabold tabular-nums">
          <span style={{ color: P1_COLOR }}>{score.p1}</span>
          <span className="text-muted-foreground mx-2 font-normal">–</span>
          <span style={{ color: P2_TEXT }}>{score.p2}</span>
        </p>
        <p className="text-muted-foreground mt-1 text-[9px] tracking-[0.12em] uppercase">
          {score.caption}
        </p>
      </div>

      {dominance !== null && (
        <div className="mt-4">
          <div className="mb-1 flex items-baseline justify-between text-[11px]">
            <span className="font-bold" style={{ color: P1_COLOR }}>
              {Math.round(dominance * 100)}%
            </span>
            <span className="text-muted-foreground tracking-[0.16em] uppercase">
              Dominance
            </span>
            <span className="font-bold" style={{ color: P2_TEXT }}>
              {Math.round((1 - dominance) * 100)}%
            </span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full">
            <div
              style={{ width: `${dominance * 100}%`, backgroundColor: P1_COLOR }}
            />
            <div className="flex-1" style={{ backgroundColor: P2_COLOR }} />
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        {attrs1.map((a, i) => (
          <AttrRow key={a.key} a={a} b={attrs2[i]} />
        ))}
      </div>
      <p className="text-muted-foreground mt-2 text-center text-[10px]">
        Every number is a measured win rate, not a rating.
      </p>

      <div className="mt-5 text-center">
        <p className="text-muted-foreground text-[9px] tracking-[0.2em] uppercase">
          On the stats
        </p>
        <p className="font-heading mt-0.5 text-2xl leading-tight">
          {leader ?? "All square"}
        </p>
        <p className="text-muted-foreground text-[11px]">{tallyLine}</p>
      </div>

      <div className="ring-border mt-5 overflow-hidden rounded-xl ring-1">
        <p className="text-muted-foreground py-2 text-center text-[9px] tracking-[0.18em] uppercase">
          The receipts
        </p>
        {receipts.map((r, i) => (
          <div
            key={r.label}
            className={`flex items-center justify-between px-3.5 py-1.5 text-xs ${i % 2 === 0 ? "bg-muted/40" : ""}`}
          >
            <span className="font-bold tabular-nums">{r.v1}</span>
            <span className="text-muted-foreground text-[11px]">{r.label}</span>
            <span className="font-bold tabular-nums">{r.v2}</span>
          </div>
        ))}
      </div>

      <ShareButton />
    </div>
  )
}

function AttrRow({ a, b }: { a: DuelAttribute; b: DuelAttribute | undefined }) {
  if (!b) return null
  const v1 = a.value
  const v2 = b.value
  const max = Math.max(v1 ?? 0, v2 ?? 0)
  const width = (v: number | null) =>
    v === null || max === 0 ? 0 : (v / max) * 100
  const p1Wins = v1 !== null && v2 !== null && v1 > v2
  const p2Wins = v1 !== null && v2 !== null && v2 > v1

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-8 shrink-0 text-right text-[13px] font-bold tabular-nums"
        style={{
          color: p1Wins ? P1_COLOR : "var(--muted-foreground)",
        }}
      >
        {a.display}
        <span className="sr-only"> — {a.sr}</span>
      </span>
      <div className="flex min-w-0 flex-1 justify-end">
        <div
          className="h-1.5 rounded-l-sm"
          style={{
            width: `${width(a.value)}%`,
            backgroundColor: P1_COLOR,
            opacity: p1Wins ? 1 : 0.3,
          }}
        />
      </div>
      <span
        className="w-9 shrink-0 text-center text-[10px] tracking-[0.06em] text-muted-foreground"
        title={b.detail}
      >
        {a.code}
        <span className="sr-only"> — {a.detail}</span>
      </span>
      <div className="min-w-0 flex-1">
        <div
          className="h-1.5 rounded-r-sm"
          style={{
            width: `${width(b.value)}%`,
            backgroundColor: P2_COLOR,
            opacity: p2Wins ? 1 : 0.3,
          }}
        />
      </div>
      <span
        className="w-8 shrink-0 text-[13px] font-bold tabular-nums"
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

function ShareButton() {
  const [copied, setCopied] = useState(false)
  const share = () => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <Button onClick={share} className="mt-4 w-full" size="sm">
      {copied ? (
        <>
          <CheckIcon aria-hidden /> Link copied
        </>
      ) : (
        <>
          <Share2Icon aria-hidden /> Share the duel
        </>
      )}
    </Button>
  )
}
