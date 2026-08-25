import { HandIcon } from "lucide-react"
import { useEffect, useId, useRef } from "react"

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
import type { CSSProperties } from "react"

// The FUT-style player card. The whole frame — shield, gradient, brushed
// texture, lightning bolts, bevel, and stat panel — is a single transparent
// PNG designed in Figma, one per side (p1 orange, p2 blue); the component
// only lays the live data over it. The one thing that must clip to the shield
// shape (the portrait) lives in a tiny SVG; everything else — the win rate,
// the name, the stats and their dividers, the trait — is one HTML flow.
//
// Every scaled size is driven off `--u`, one card-width percent measured in
// px by a ResizeObserver, not the `cqi` container unit it falls back to.
// Safari doesn't re-resolve container units under page zoom the way it scales
// px/raster content, so a cqi-sized overlay drifts against the raster frame
// when you zoom; a px measurement scales in lockstep with the frame. The
// `1cqi` fallback keeps the server-rendered markup and first paint correct
// (identical to the px value at 100% zoom, so hydration is seamless).

export const FRAMES: Record<"p1" | "p2", string> = {
  p1: "/card-frame-p1.png",
  p2: "/card-frame-p2.png",
}

const THEMES = {
  p1: { muted: "#E3BCAB", divider: "#C07C63" },
  p2: { muted: "#A9BEDF", divider: "#6387C0" },
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

/** One card-width-percent as a length. Resolves to the measured px unit once
 *  the ResizeObserver has run, and to the `cqi` container unit before then. */
const u = (n: number) => `calc(${n} * var(--u, 1cqi))`

/** Keep `--u` on the card in sync with its measured width (in px), so every
 *  `u()` length tracks the frame under zoom instead of drifting like `cqi`. */
function useCardUnit() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () =>
      el.style.setProperty("--u", `${el.clientWidth / 100}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

/** A hairline that fades to nothing at both ends. `axis` sets the fade
 *  direction; the caller sizes it with width/height. */
function FadeRule({
  axis,
  colour,
  className,
  style,
}: {
  axis: "x" | "y"
  colour: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        background: `linear-gradient(${axis === "x" ? "90deg" : "180deg"}, transparent, ${colour}, transparent)`,
        ...style,
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
  const cardRef = useCardUnit()

  // one stat, as a pair that spans its column's two subgrid tracks — the
  // number right-aligned in the shared number track, the code left-aligned in
  // the code track — so every number and code lines up without a fixed width
  const stat = (a: PlayerAttribute) => {
    const pair = (
      <div
        key={a.key}
        tabIndex={statTooltips ? 0 : undefined}
        className={cn(
          "col-span-2 grid grid-cols-subgrid items-baseline",
          statTooltips && "cursor-help rounded-sm"
        )}
        style={{ columnGap: u(2.5) }}
      >
        <dd
          className="text-right font-extrabold text-white tabular-nums"
          style={{ fontSize: u(7.8) }}
        >
          {a.display}
        </dd>
        <dt
          className="font-medium"
          style={{ fontSize: u(7.8), color: t.muted }}
        >
          {a.code}
          <span className="sr-only">
            {" "}
            — {a.detail}: {a.sr}
          </span>
        </dt>
      </div>
    )
    if (!statTooltips) return pair
    return (
      <Tooltip key={a.key}>
        <TooltipTrigger asChild>{pair}</TooltipTrigger>
        <TooltipContent>
          {a.detail}: {a.sr}
        </TooltipContent>
      </Tooltip>
    )
  }

  const statColumn = (picks: Array<number>) => (
    <dl
      className="grid grid-cols-[auto_auto] items-baseline"
      style={{ rowGap: u(1.5) }}
    >
      {picks.map((i) => stat(attrs[i]))}
    </dl>
  )

  return (
    <div ref={cardRef} className="@container">
      <div className="relative">
        <img src={FRAMES[side]} alt="" className="block w-full" />

        {/* the portrait is the only layer that must clip to the shield shape;
            it's an SVG so it scales as one unit with the card and stays put
            under zoom in every browser. The cutout fits inside a box on the
            right half (so it can never reach the hero number), centred and
            bottom-anchored to the panel line, `meet` so nothing is cropped */}
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
            x="100"
            y="14"
            width="284"
            height="280"
            preserveAspectRatio="xMidYMax meet"
            clipPath={`url(#${clipId})`}
          />
        </svg>

        {/* hero number + handedness, in the top-left of the upper half —
            left-aligned so the rate, its label, and the hand share an edge */}
        <div
          className="absolute flex flex-col items-start"
          style={{ top: u(20), left: u(14) }}
        >
          <span
            className="leading-none font-extrabold text-white"
            style={{ fontSize: u(11) }}
          >
            {hero.display}
          </span>
          <span
            className="font-semibold tracking-[0.14em] uppercase"
            style={{ marginTop: u(1.5), fontSize: u(3.8), color: t.muted }}
          >
            {hero.label}
          </span>
          {handedness && (
            <span
              className="flex items-center font-semibold text-white/90"
              style={{ marginTop: u(4), gap: u(1.5), fontSize: u(5.4) }}
            >
              <HandIcon
                aria-hidden
                style={{
                  width: u(5.4),
                  height: u(5.4),
                  transform: handedness === "left" ? "scaleX(-1)" : undefined,
                }}
              />
              {handedness === "left" ? "L" : "R"}
              <span className="sr-only">
                {" "}
                ({HANDEDNESS_LABELS[handedness]})
              </span>
            </span>
          )}
        </div>

        {/* the panel's content as one centred flow: name, rule, stats (with
            the column divider inside the grid), rule, trait. Aligning the
            stats now moves their divider with them. */}
        <TooltipProvider>
          <div
            className="absolute inset-x-0 flex flex-col items-center"
            style={{ top: u(82) }}
          >
            <p
              className="max-w-[82%] truncate leading-none font-extrabold tracking-wide text-white uppercase"
              style={{ fontSize: u(9.5) }}
            >
              {name}
            </p>

            <FadeRule
              axis="x"
              colour={t.divider}
              className="w-[70%]"
              style={{ marginTop: u(2.5), height: u(0.4) }}
            />

            {/* two stat columns, each aligning its numbers and codes via
                subgrid, with the divider as a flex sibling between them so it
                stretches to the columns' height and stays centred on them */}
            <div
              className="flex items-stretch justify-center"
              style={{ marginTop: u(2.5), gap: u(6) }}
            >
              {statColumn([0, 2, 4])}
              <FadeRule
                axis="y"
                colour={t.divider}
                className="self-stretch"
                style={{ width: u(0.4) }}
              />
              {statColumn([1, 3, 5])}
            </div>

            <FadeRule
              axis="x"
              colour={t.divider}
              className="w-[16%]"
              style={{ marginTop: u(2.5), height: u(0.4) }}
            />

            {trait && (
              <p
                className="font-bold tracking-[0.14em] uppercase"
                style={{ marginTop: u(2), fontSize: u(5), color: t.muted }}
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
