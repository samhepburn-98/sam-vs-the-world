import { CheckIcon, Share2Icon } from "lucide-react"
import { useState } from "react"

import { DuelAttributeRow } from "@/features/dashboard/components/duel-attribute-row"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"

// The centre column of the duel: score, dominance split,
// the six attributes as diverging rows, the stats verdict, the receipts
// table of raw counts, and the share button. Player one is always the left
// side in orange; player two the right in blue — same convention as the
// cards flanking it.

const P1_COLOR = "var(--primary)"
const P1_TEXT = "var(--primary-strong)"
const P2_COLOR = "var(--p2)"
const P2_TEXT = "var(--p2-strong)"

export interface DuelReceipt {
  label: string
  p1Value: string
  p2Value: string
}

export function DuelCenter({
  p1Name,
  p2Name,
  score,
  dominance,
  p1Attrs,
  p2Attrs,
  tally,
  receipts,
}: {
  p1Name: string
  p2Name: string
  score: { p1: number; p2: number; heading: string; caption: string }
  /** player one's share, 0–1 — null hides the bar (not enough data) */
  dominance: number | null
  p1Attrs: Array<PlayerAttribute>
  p2Attrs: Array<PlayerAttribute>
  tally: { p1: number; p2: number }
  receipts: Array<DuelReceipt>
}) {
  const leader =
    tally.p1 === tally.p2 ? null : tally.p1 > tally.p2 ? p1Name : p2Name
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
          <span style={{ color: P1_TEXT }}>{score.p1}</span>
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
            <span className="font-bold" style={{ color: P1_TEXT }}>
              {Math.round(dominance * 100)}%
            </span>
            <span className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
              Dominance
            </span>
            <span className="font-bold" style={{ color: P2_TEXT }}>
              {Math.round((1 - dominance) * 100)}%
            </span>
          </div>
          {/* square broadcast split with the hairline notch at the boundary */}
          <div className="flex h-2">
            <div
              style={{
                width: `calc(${dominance * 100}% - 1px)`,
                backgroundColor: P1_COLOR,
              }}
            />
            <div className="w-0.5 bg-background" />
            <div className="flex-1" style={{ backgroundColor: P2_COLOR }} />
          </div>
        </div>
      )}

      <div className="mt-7 flex flex-col gap-3.5">
        {p1Attrs.map((attr, i) => (
          <DuelAttributeRow key={attr.key} p1Attr={attr} p2Attr={p2Attrs[i]} />
        ))}
      </div>

      {/* the verdict strip: a deep panel like a full-time graphic, with the
          leader's name in their own colour (all square stays neutral) */}
      <div className="mt-10 bg-panel-deep py-4 text-center md:mt-14">
        <p className="font-heading text-[13px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          On the stats
        </p>
        <p
          className={cn(
            "mt-1 font-heading text-4xl leading-none font-extrabold uppercase",
            leader === p1Name && "text-primary-strong",
            leader === p2Name && "text-p2-strong"
          )}
        >
          {leader ?? "All square"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{tallyLine}</p>
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
            <span className="font-bold tabular-nums">{r.p1Value}</span>
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <span className="font-bold tabular-nums">{r.p2Value}</span>
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
