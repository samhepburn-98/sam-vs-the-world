import { CheckIcon, Share2Icon } from "lucide-react"
import { useState } from "react"

import { DuelAttributeRow } from "@/features/dashboard/components/duel-attribute-row"
import { Button } from "@/components/ui/button"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"

// The centre column of the duel: score, dominance split,
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
  attrs1: Array<PlayerAttribute>
  attrs2: Array<PlayerAttribute>
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
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          {score.heading}
        </p>
        <p className="mt-1 text-6xl leading-none font-extrabold tabular-nums">
          <span style={{ color: P1_COLOR }}>{score.p1}</span>
          <span className="mx-3 font-normal text-muted-foreground">–</span>
          <span style={{ color: P2_TEXT }}>{score.p2}</span>
        </p>
        <p className="mt-1.5 text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
          {score.caption}
        </p>
      </div>

      {dominance !== null && (
        <div className="mt-6">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-bold" style={{ color: P1_COLOR }}>
              {Math.round(dominance * 100)}%
            </span>
            <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              Dominance
            </span>
            <span className="font-bold" style={{ color: P2_TEXT }}>
              {Math.round((1 - dominance) * 100)}%
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full">
            <div
              style={{
                width: `${dominance * 100}%`,
                backgroundColor: P1_COLOR,
              }}
            />
            <div className="flex-1" style={{ backgroundColor: P2_COLOR }} />
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3.5">
        {attrs1.map((a, i) => (
          <DuelAttributeRow key={a.key} a={a} b={attrs2[i]} />
        ))}
      </div>

      <div className="mt-10 text-center md:mt-14">
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
          On the stats
        </p>
        <p className="mt-1.5 font-heading text-3xl leading-tight">
          {leader ?? "All square"}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{tallyLine}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl ring-1 ring-border">
        <p className="py-2.5 text-center text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          The receipts
        </p>
        {receipts.map((r, i) => (
          <div
            key={r.label}
            className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 === 0 ? "bg-muted/40" : ""}`}
          >
            <span className="font-bold tabular-nums">{r.v1}</span>
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <span className="font-bold tabular-nums">{r.v2}</span>
          </div>
        ))}
      </div>

      <ShareButton />
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
