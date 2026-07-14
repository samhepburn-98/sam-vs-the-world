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
// only lays the live data over it. The one thing that must clip to the shield
// shape (the portrait) lives in a tiny SVG; everything else — the win rate,
// the name, the stats and their dividers, the trait — is one HTML flow scaled
// off the @container, so the dividers align to the stats by being part of the
// same layout rather than a second coordinate system to keep in sync.

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

/** A hairline that fades to nothing at both ends. `axis` sets the fade
 *  direction; the caller sizes it with width/height classes. */
function FadeRule({
  axis,
  colour,
  className,
}: {
  axis: "x" | "y"
  colour: string
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(${axis === "x" ? "90deg" : "180deg"}, transparent, ${colour}, transparent)`,
      }}
    />
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
  const clipId = useId()

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

        {/* the portrait is the only layer that must clip to the shield shape:
            the whole cutout fit inside a box on the right half (so it can
            never reach the hero number), centred and bottom-anchored to the
            panel line (y=294), `meet` so nothing is cropped */}
        <svg
          viewBox="0 0 384 612"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
          focusable="false"
        >
          <clipPath id={clipId}>
            <path d={SHIELD} />
          </clipPath>
          <image
            href={avatarSrc}
            x="140"
            y="14"
            width="244"
            height="280"
            preserveAspectRatio="xMidYMax meet"
            clipPath={`url(#${clipId})`}
          />
        </svg>

        {/* hero number + handedness, in the top-left of the upper half */}
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
              <span className="sr-only"> ({HANDEDNESS_LABELS[handedness]})</span>
            </span>
          )}
        </div>

        {/* the panel's content as one centred flow: name, rule, stats (with
            the column divider inside the grid), rule, trait. Aligning the
            stats now moves their divider with them. */}
        <TooltipProvider>
          <div className="absolute inset-x-0 top-[79cqi] flex flex-col items-center">
            <p className="max-w-[82%] truncate text-[11.5cqi] leading-none font-extrabold tracking-wide text-white uppercase">
              {name}
            </p>

            <FadeRule
              axis="x"
              colour={t.divider}
              className="mt-[3cqi] h-[0.4cqi] w-[70%]"
            />

            <div className="relative mt-[3.5cqi] grid w-full grid-cols-2 px-[13cqi]">
              <dl className="flex flex-col items-end gap-[1.7cqi] pr-[4cqi]">
                {[attrs[0], attrs[2], attrs[4]].map(stat)}
              </dl>
              <dl className="flex flex-col items-start gap-[1.7cqi] pl-[4cqi]">
                {[attrs[1], attrs[3], attrs[5]].map(stat)}
              </dl>
              {/* column divider: centred on the grid, spanning its rows, so it
                  tracks the stats automatically */}
              <FadeRule
                axis="y"
                colour={t.divider}
                className="absolute inset-y-[2cqi] left-1/2 w-[0.4cqi] -translate-x-1/2"
              />
            </div>

            <FadeRule
              axis="x"
              colour={t.divider}
              className="mt-[3.5cqi] h-[0.4cqi] w-[16%]"
            />

            {trait && (
              <p
                className="mt-[2.5cqi] text-[5.2cqi] font-bold tracking-[0.14em] uppercase"
                style={{ color: t.muted }}
              >
                {TRAIT_LABELS[trait]}
              </p>
            )}
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
