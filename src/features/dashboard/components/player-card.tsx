import { HandIcon } from "lucide-react"
import { useId } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TRAIT_LABELS } from "@/features/dashboard/lib/player-attributes"
import { cn } from "@/lib/utils"

import type { PlayerAttribute } from "@/features/dashboard/lib/player-attributes"
import type { SignatureTrait } from "@/features/dashboard/schemas/insights"
import type { Handedness } from "@/lib/schemas/enums"

// The FUT-style player card. The whole frame — shield, gradient, brushed
// texture, lightning bolts, bevel, and stat panel — is a single transparent
// PNG designed in Figma, one per side (p1 blue, p2 orange); the component
// only lays the live data over it: the portrait (a transparent cutout,
// clipped to the shield and stopped at the panel line so it meets the panel
// cleanly), the two fading stat dividers, and the text. Everything scales off
// the @container, so the whole card holds its proportions at any width, and
// the text keeps truncation, sr-only copy, and the opt-in tooltips.

const FRAMES: Record<"p1" | "p2", string> = {
  p1: "/card-frame-p1.png",
  p2: "/card-frame-p2.png",
}

const THEMES = {
  p1: { muted: "#A9BEDF", divider: "#6387C0" },
  p2: { muted: "#E3BCAB", divider: "#C07C63" },
} as const

const HANDEDNESS_LABELS: Record<Handedness, string> = {
  left: "Left-handed",
  right: "Right-handed",
}

// The shield silhouette, in the frame's 384×612 space — used only to clip the
// portrait to the card's edge so a photo never spills into the transparent
// corners.
const SHIELD =
  "M334.232 31.8442C334.036 29.8135 333.939 28.7981 333.433 28.1238C332.927 27.4495 332.068 27.1074 330.351 26.4232C287.557 9.37441 240.873 0 192 0C143.127 0 96.4433 9.37442 53.6492 26.4232C51.9319 27.1074 51.0732 27.4495 50.5672 28.1238C50.0612 28.7981 49.9636 29.8135 49.7683 31.8442C47.5221 55.2085 29.1964 73.8747 5.9892 76.645C3.00504 77.0012 1.51296 77.1793 0.756479 78.0315C0 78.8836 0 80.2558 0 83V476.865C0 503.212 0 516.385 7.01673 525.909C14.0335 535.433 26.9835 539.451 52.8836 547.488C108.588 564.771 188.75 592.823 192 612C195.25 592.823 275.412 564.771 331.116 547.488C357.016 539.451 369.967 535.433 376.983 525.909C384 516.385 384 503.212 384 476.865V83C384 80.2558 384 78.8836 383.244 78.0315C382.487 77.1793 380.995 77.0012 378.011 76.645C354.804 73.8747 336.478 55.2084 334.232 31.8442Z"

/** A hairline divider that fades out at both ends, as in the design. */
function Divider({
  x,
  y,
  width,
  height,
  gradientId,
}: {
  x: number
  y: number
  width: number
  height: number
  gradientId: string
}) {
  return (
    <rect x={x} y={y} width={width} height={height} fill={`url(#${gradientId})`} />
  )
}

/** The portrait and stat dividers, laid over the PNG frame in its 384×612
 *  space so they stay pinned to the artwork at any size. */
function CardOverlay({ side, avatarSrc }: { side: "p1" | "p2"; avatarSrc: string }) {
  const t = THEMES[side]
  const uid = useId()
  const id = (name: string) => `${name}-${uid}`
  const url = (name: string) => `url(#${id(name)})`

  return (
    <svg
      viewBox="0 0 384 612"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id={id("shield")}>
          <path d={SHIELD} />
        </clipPath>
        <linearGradient id={id("div-h")} x1="0" y1="0" x2="1" y2="0">
          <stop stopColor={t.divider} stopOpacity="0" />
          <stop offset="0.5" stopColor={t.divider} />
          <stop offset="1" stopColor={t.divider} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("div-v")} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={t.divider} stopOpacity="0" />
          <stop offset="0.5" stopColor={t.divider} />
          <stop offset="1" stopColor={t.divider} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* portrait: the whole cutout fit inside a box on the right half of the
          card (so it can never reach the hero number on the left), centred in
          the box and anchored to its bottom — the panel line (y=294) — with
          `meet` so nothing is cropped. Clipped to the shield for the corners. */}
      <g clipPath={url("shield")}>
        <image
          href={avatarSrc}
          x="140"
          y="14"
          width="244"
          height="280"
          preserveAspectRatio="xMidYMax meet"
        />
      </g>

      {/* stat-grid hairlines: under the name, between the columns, above the
          trait */}
      <Divider x={58} y={360} width={268} height={2} gradientId={id("div-h")} />
      <Divider x={191} y={376} width={2} height={118} gradientId={id("div-v")} />
      <Divider x={163} y={508} width={58} height={2} gradientId={id("div-h")} />
    </svg>
  )
}

export function PlayerCard({
  name,
  side,
  avatarSrc,
  trait,
  handedness,
  hero,
  attrs,
  statTooltips = false,
}: {
  name: string
  side: "p1" | "p2"
  avatarSrc: string
  trait: SignatureTrait | null
  handedness: Handedness | null
  hero: { display: string; label: string }
  attrs: Array<PlayerAttribute>
  /** Hover/focus tooltips explaining each attribute. Off by default — a
   *  context that already explains the attributes (the compare page's
   *  glossary dialog) shouldn't repeat itself. */
  statTooltips?: boolean
}) {
  const t = THEMES[side]

  const stat = (a: PlayerAttribute) => {
    const row = (
      <div
        key={a.key}
        tabIndex={statTooltips ? 0 : undefined}
        className={cn(
          "flex items-baseline gap-[2.5cqi]",
          statTooltips && "cursor-help rounded-sm"
        )}
      >
        <dd className="w-[10cqi] text-right text-[7.8cqi] font-extrabold tabular-nums text-white">
          {a.display}
        </dd>
        <dt className="text-[7.8cqi] font-medium" style={{ color: t.muted }}>
          {a.code}
          <span className="sr-only">
            {" "}
            — {a.detail}: {a.sr}
          </span>
        </dt>
      </div>
    )
    if (!statTooltips) return row
    return (
      <Tooltip key={a.key}>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent>
          {a.detail}: {a.sr}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="@container">
      <div className="relative">
        <img src={FRAMES[side]} alt="" className="block w-full" />

        <CardOverlay side={side} avatarSrc={avatarSrc} />

        {/* the data layer, positioned in container units over the frame */}
        <div className="absolute inset-0">
          {/* hero number + handedness, stacked top-left */}
          <div className="absolute top-[16cqi] left-[14cqi] flex flex-col">
            <span className="text-[11cqi] leading-none font-extrabold text-white">
              {hero.display}
            </span>
            <span
              className="mt-[1.5cqi] text-[3.4cqi] font-semibold tracking-[0.14em] uppercase"
              style={{ color: t.muted }}
            >
              {hero.label}
            </span>
            {handedness && (
              <span className="mt-[4cqi] flex items-center gap-[1.5cqi] text-[5.4cqi] font-semibold text-white/90">
                <HandIcon
                  aria-hidden
                  className="size-[5.4cqi]"
                  style={
                    handedness === "left"
                      ? { transform: "scaleX(-1)" }
                      : undefined
                  }
                />
                {handedness === "left" ? "L" : "R"}
                <span className="sr-only">
                  {" "}
                  ({HANDEDNESS_LABELS[handedness]})
                </span>
              </span>
            )}
          </div>

          {/* name band, centred in the panel-top-to-rule band (y≈294→360) */}
          <p className="absolute top-[82cqi] right-[9cqi] left-[9cqi] truncate text-center text-[11.5cqi] leading-none font-extrabold tracking-wide text-white uppercase">
            {name}
          </p>

          {/* the six attributes, two columns hugging the centre rule
              symmetrically — the left column right-aligned, the right column
              left-aligned, so the gaps either side of the divider match */}
          <TooltipProvider>
            <div className="absolute top-[98cqi] right-[13cqi] left-[13cqi] grid grid-cols-2 gap-[8cqi]">
              <dl className="flex flex-col items-end gap-[1.7cqi]">
                {[attrs[0], attrs[2], attrs[4]].map(stat)}
              </dl>
              <dl className="flex flex-col items-start gap-[1.7cqi]">
                {[attrs[1], attrs[3], attrs[5]].map(stat)}
              </dl>
            </div>
          </TooltipProvider>

          {/* trait footer under the short rule */}
          {trait && (
            <p
              className="absolute top-[137.5cqi] right-[10cqi] left-[10cqi] text-center text-[5.2cqi] font-bold tracking-[0.14em] uppercase"
              style={{ color: t.muted }}
            >
              {TRAIT_LABELS[trait]}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
