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

// The FUT-style player card, second edition — geometry and gradients lifted
// straight from the Figma export (384×612): a dome-topped shield with
// scalloped corner notches tapering to a point, lightning bolts behind the
// portrait, a darker stat panel over the lower half, and a brushed-metal
// overlay. A physical collectible, so its colours are hardcoded — the card
// reads identically in light and dark mode. Player one is the blue variant,
// player two the orange, matching the app's p1/p2 convention.
//
// Architecture: all art lives in one background SVG that scales off its
// viewBox; the data (win rate, handedness, name, stats, trait) is an HTML
// layer on top in container units, so text keeps truncation, sr-only copy,
// and the opt-in tooltips.

const THEMES = {
  p1: {
    body: ["#013993", "#11213C"],
    bolt: "#09419A",
    boltShadow: "#6F8FC3",
    panel: ["#12274A", "#0B3374", "#11274B", "#0D1726"],
    divider: "#6387C0",
    muted: "#A9BEDF",
  },
  p2: {
    body: ["#932801", "#3C1C11"],
    bolt: "#9A3009",
    boltShadow: "#C3856F",
    panel: ["#4A2112", "#74270B", "#4B2011", "#26140D"],
    divider: "#C07C63",
    muted: "#E3BCAB",
  },
} as const

const HANDEDNESS_LABELS: Record<Handedness, string> = {
  left: "Left-handed",
  right: "Right-handed",
}

// The shield silhouette from the export: dome top, quarter-circle notches at
// the shoulders, straight sides, and the long taper to the bottom point.
const SHIELD =
  "M334.232 31.8442C334.036 29.8135 333.939 28.7981 333.433 28.1238C332.927 27.4495 332.068 27.1074 330.351 26.4232C287.557 9.37441 240.873 0 192 0C143.127 0 96.4433 9.37442 53.6492 26.4232C51.9319 27.1074 51.0732 27.4495 50.5672 28.1238C50.0612 28.7981 49.9636 29.8135 49.7683 31.8442C47.5221 55.2085 29.1964 73.8747 5.9892 76.645C3.00504 77.0012 1.51296 77.1793 0.756479 78.0315C0 78.8836 0 80.2558 0 83V476.865C0 503.212 0 516.385 7.01673 525.909C14.0335 535.433 26.9835 539.451 52.8836 547.488C108.588 564.771 188.75 592.823 192 612C195.25 592.823 275.412 564.771 331.116 547.488C357.016 539.451 369.967 535.433 376.983 525.909C384 516.385 384 503.212 384 476.865V83C384 80.2558 384 78.8836 383.244 78.0315C382.487 77.1793 380.995 77.0012 378.011 76.645C354.804 73.8747 336.478 55.2084 334.232 31.8442Z"

// The stat panel over the lower half, sharing the shield's bottom taper.
const PANEL =
  "M0 324V476.865C0 503.212 0 516.385 7.01685 525.909C14.0334 535.433 26.9834 539.451 52.8835 547.488C108.588 564.771 188.75 592.823 192 612C195.25 592.823 275.412 564.771 331.116 547.488C357.017 539.451 369.967 535.433 376.983 525.909C384 516.385 384 503.212 384 476.865V324V294H192H0L0 324Z"

// The two lightning bolts behind the portrait.
const BOLT_A =
  "M567.346 115.729C530.254 127.998 492.201 144.713 457.882 164.948L457.811 130.381C404.181 157.907 349.627 200.014 304.71 244.931L304.603 195.533C296.175 203.037 294.752 204.957 286.644 213.066C228.213 271.497 183.865 339.743 154.881 411.902L216.121 473.142C235.112 408.63 272.311 338.783 316.552 284.086L316.659 342.161C334.654 315.916 349.804 299.343 373.098 276.049C400.02 249.127 427.155 227.469 457.953 207.625L458.024 243.828C500.096 204.531 549.422 169.643 599.603 147.985L567.346 115.729Z"
const BOLT_B =
  "M447.106 38.3067C410.013 50.5761 371.96 67.291 337.642 87.5266L337.57 52.9589C283.941 80.4851 229.386 122.592 184.469 167.509L184.363 118.111C175.934 125.615 174.512 127.536 166.403 135.644C107.972 194.075 63.6246 262.321 34.6403 334.48L95.8807 395.72C114.872 331.208 152.071 261.361 196.312 206.664L196.419 264.74C214.414 238.494 229.564 221.921 252.858 198.627C279.78 171.705 306.915 150.047 337.713 130.203L337.784 166.407C379.855 127.18 429.146 92.2566 479.362 70.634L447.106 38.3067Z"

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

/** All the card's art, scaling off the 384×612 viewBox. */
function CardArt({ side, avatarSrc }: { side: "p1" | "p2"; avatarSrc: string }) {
  const t = THEMES[side]
  const uid = useId()
  const id = (name: string) => `${name}-${uid}`
  const url = (name: string) => `url(#${id(name)})`

  return (
    <svg
      viewBox="0 0 384 612"
      className="block w-full"
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id={id("shield")}>
          <path d={SHIELD} />
        </clipPath>
        <linearGradient
          id={id("body")}
          x1="0"
          y1="0"
          x2="384"
          y2="306"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={t.body[0]} />
          <stop offset="1" stopColor={t.body[1]} />
        </linearGradient>
        <linearGradient
          id={id("panel")}
          x1="0"
          y1="324"
          x2="192"
          y2="612"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={t.panel[0]} />
          <stop offset="0.39" stopColor={t.panel[1]} />
          <stop offset="0.68" stopColor={t.panel[2]} />
          <stop offset="1" stopColor={t.panel[3]} />
        </linearGradient>
        {/* dividers fade to nothing at their ends */}
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
        {/* the design's portraits are transparent cutouts; ours are plain
            photos, so a feather mask dissolves the photo's edges into the
            card instead of a hard rectangle over the hero number */}
        <radialGradient id={id("photo-fade")} cx="0.55" cy="0.42" r="0.62">
          <stop offset="0.45" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={id("photo-mask")}>
          <rect
            x="60"
            y="18"
            width="292"
            height="282"
            fill={url("photo-fade")}
          />
        </mask>
        {/* the bolts carry a hard offset shadow, straight from the export */}
        <filter
          id={id("bolt-shadow")}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
        >
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="0"
            floodColor={t.boltShadow}
          />
        </filter>
        {/* edge lighting: soft white top/right, dark left */}
        <filter
          id={id("edges")}
          x="-3"
          y="0"
          width="390"
          height="615"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" />
          <feBlend in2="shape" result="inner1" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" />
          <feBlend in2="inner1" result="inner2" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dx="-3" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" />
          <feBlend in2="inner2" />
        </filter>
      </defs>

      <g filter={url("edges")}>
        <path d={SHIELD} fill={url("body")} />
      </g>

      <g clipPath={url("shield")}>
        <g filter={url("bolt-shadow")}>
          <path d={BOLT_A} fill={t.bolt} fillRule="evenodd" />
          <path d={BOLT_B} fill={t.bolt} fillRule="evenodd" />
        </g>

        {/* the portrait: slice-cropped bust, feathered at the edges, and
            hard-stopped by the panel drawn over it */}
        <image
          href={avatarSrc}
          x="60"
          y="18"
          width="292"
          height="282"
          preserveAspectRatio="xMidYMid slice"
          mask={url("photo-mask")}
        />

        <path d={PANEL} fill={url("panel")} />

        {/* stat-grid hairlines: under the name, between the columns, above
            the trait */}
        <Divider x={58} y={360} width={268} height={2} gradientId={id("div-h")} />
        <Divider x={191} y={376} width={2} height={118} gradientId={id("div-v")} />
        <Divider x={163} y={508} width={58} height={2} gradientId={id("div-h")} />

        {/* brushed-metal texture over everything, as in the design */}
        <image
          href="/card-texture.jpg"
          x="0"
          y="0"
          width="384"
          height="612"
          preserveAspectRatio="xMidYMid slice"
          opacity="0.5"
          style={{ mixBlendMode: "overlay" }}
        />
      </g>
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
        <dd className="w-[9cqi] text-right text-[6.8cqi] font-extrabold tabular-nums text-white">
          {a.display}
        </dd>
        <dt className="text-[6.8cqi] font-medium" style={{ color: t.muted }}>
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
        <CardArt side={side} avatarSrc={avatarSrc} />

        {/* the data layer, positioned in container units over the art */}
        <div className="absolute inset-0">
          {/* hero number + handedness, stacked top-left */}
          <div className="absolute top-[13cqi] left-[13cqi] flex flex-col">
            <span className="text-[13cqi] leading-none font-extrabold text-white">
              {hero.display}
            </span>
            <span
              className="mt-[1.5cqi] text-[3.1cqi] font-semibold tracking-[0.14em] uppercase"
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
                {handedness === "left" ? "LH" : "RH"}
                <span className="sr-only">
                  {" "}
                  ({HANDEDNESS_LABELS[handedness]})
                </span>
              </span>
            )}
          </div>

          {/* name band */}
          <p className="absolute top-[80.5cqi] right-[10cqi] left-[10cqi] truncate text-center text-[9cqi] leading-none font-extrabold tracking-wide text-white uppercase">
            {name}
          </p>

          {/* the six attributes, two columns split by the art's divider */}
          <TooltipProvider>
            <div className="absolute top-[97cqi] right-[15cqi] left-[15cqi] grid grid-cols-2 gap-[8cqi]">
              <dl className="flex flex-col gap-[3.2cqi]">
                {[attrs[0], attrs[2], attrs[4]].map(stat)}
              </dl>
              <dl className="flex flex-col gap-[3.2cqi] pl-[4cqi]">
                {[attrs[1], attrs[3], attrs[5]].map(stat)}
              </dl>
            </div>
          </TooltipProvider>

          {/* trait footer under the short rule */}
          {trait && (
            <p
              className="absolute top-[135.5cqi] right-[10cqi] left-[10cqi] text-center text-[4.4cqi] font-bold tracking-[0.14em] uppercase"
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
