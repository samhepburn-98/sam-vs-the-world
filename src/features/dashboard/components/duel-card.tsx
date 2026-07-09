import { HandIcon } from "lucide-react"

import { TRAIT_LABELS } from "@/features/dashboard/lib/duel-attributes"

import type { DuelAttribute } from "@/features/dashboard/lib/duel-attributes"
import type { SignatureTrait } from "@/features/dashboard/schemas/insights"
import type { Handedness } from "@/lib/schemas/enums"

// The FUT-style player card (§5.1 redesign). A physical collectible object,
// so its dark scene colours are hardcoded — the card looks the same in light
// and dark mode rather than inverting. Player one runs hot (gold/orange),
// player two cool (silver/blue), matching the app's p1/p2 convention.
//
// Everything inside scales in `cqi` (container-inline) units, so the card
// holds its proportions whether it's 16rem on desktop or a ~10rem half of a
// mobile two-up. The foil sheen, glow, crest, and gradient rule are what
// make it read as a premium card and not a stat panel.

const THEMES = {
  p1: {
    border: "#F5B841",
    glow: "rgba(234,88,12,0.55)",
    glowAt: "55% 22%",
    bg: "#130f0e",
    accent: "#F5B841",
    accentSoft: "#f5d9a8",
    muted: "#c9b79c",
    rule: "245,184,65",
    numberGlow: "rgba(245,184,65,0.55)",
    // gitfut's photo treatment: an overlay that's clear in the middle, a warm
    // sheen through the mid, then the card's own dark toward the edges, so the
    // photo blends into the ground instead of ending in a hard rectangle
    feather:
      "radial-gradient(ellipse 72% 72% at 52% 42%, transparent 36%, rgba(232,205,160,0.14) 66%, rgba(19,15,14,0.66))",
  },
  p2: {
    border: "#C7CCD4",
    glow: "rgba(59,130,246,0.55)",
    glowAt: "45% 22%",
    bg: "#0d1018",
    accent: "#93C5FD",
    accentSoft: "#bcd6f7",
    muted: "#aab4c4",
    rule: "199,204,212",
    numberGlow: "rgba(147,197,253,0.5)",
    feather:
      "radial-gradient(ellipse 72% 72% at 52% 42%, transparent 36%, rgba(170,188,210,0.18) 66%, rgba(13,16,24,0.66))",
  },
} as const

const HANDEDNESS_LABELS: Record<Handedness, string> = {
  left: "Left-handed",
  right: "Right-handed",
}

// feather the photo into the card on every edge — the radii are kept well
// under 100% so the fade zone falls INSIDE the box (a 100%-radius ellipse
// leaves the box edges near-solid), letting the figure dissolve into the
// dark ground like the FUT photo treatment, strongest at the bottom
// the mask does the shape. A solid core keeps the face legible, then a long,
// gentle fade (28%→90% with a soft mid-stop) dissolves the outer band so the
// edge reads smooth rather than abrupt. The ellipse is deliberately wide and
// tall (uneven radii) so the blob is oval, not a circle. The colour overlay
// (per theme) tints what's left so it blends into the card ground.
// ── PLAY WITH THIS LINE ──────────────────────────────────────────────────
// This is the shape/feather of the photo. It's a radial gradient used as a
// mask: where it's #000 the photo is solid, where it's transparent the photo
// disappears. Four knobs, in order:
//   1. "66% 66%"  = the fade ellipse radii (width% height%). SMALLER = blob
//      sits further inside the box = more rounded / less square. Equal numbers
//      = circular; make them differ for an oval.
//   2. "at 52% 43%" = where the blob is centred.
//   3. "#000 18%"  = photo is fully solid out to 18% of the radius. LOWER =
//      smaller solid core = more of the photo is feathering.
//   4. "transparent 80%" = fully gone by 80%. A BIGGER gap between 18% and 80%
//      = longer, softer feather. Keep this well under 100% or the fade runs
//      off the box edge and looks abrupt/square again.
const AVATAR_MASK =
  "radial-gradient(66% 66% at 52% 43%, #000 18%, transparent 80%)"

// the FUT shield silhouette. A polygon() can only draw straight lines, so
// the bottom would be a crude chevron; instead this is an SVG path with real
// bezier curves — straight sides that sweep through rounded shoulders down to
// the point. clipPathUnits="objectBoundingBox" means the 0–1 coordinates
// scale to whatever size the card is, and the same clip on the accent shell +
// inner fill keeps the hairline edge following the curve to the tip.
const SHIELD_PATH =
  "M 0.05 0 L 0.95 0 Q 1 0 1 0.05 L 1 0.78 C 1 0.9 0.72 0.96 0.5 1 C 0.28 0.96 0 0.9 0 0.78 L 0 0.05 Q 0 0 0.05 0 Z"
const SHIELD = "url(#duel-shield)"

/** The shield clip-path definition — rendered once per duel and referenced by
 *  every card's clip-path. objectBoundingBox units scale it to any card size. */
export function DuelShieldDef() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" className="absolute">
      <defs>
        <clipPath id="duel-shield" clipPathUnits="objectBoundingBox">
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>
    </svg>
  )
}

export function DuelCard({
  name,
  side,
  avatarSrc,
  trait,
  handedness,
  hero,
  attrs,
}: {
  name: string
  side: "p1" | "p2"
  avatarSrc: string
  trait: SignatureTrait | null
  handedness: Handedness | null
  hero: { display: string; label: string }
  attrs: Array<DuelAttribute>
}) {
  const t = THEMES[side]

  const stat = (a: DuelAttribute) => (
    <div key={a.key} className="flex items-baseline gap-[2.5cqi]">
      <dd className="text-[6.4cqi] font-extrabold tabular-nums text-white">
        {a.display}
      </dd>
      {/* label matches the number's size (so they scale identically) but is
          lighter weight so the number still leads */}
      <dt className="text-[6.4cqi] font-normal" style={{ color: t.muted }}>
        {a.code}
        <span className="sr-only">
          {" "}
          — {a.detail}: {a.sr}
        </span>
      </dt>
    </div>
  )

  const stats = (
    <div className="flex w-[23cqi] flex-col items-center text-center">
      <span
        className="text-[11cqi] leading-none font-extrabold"
        style={{ color: t.accent, textShadow: `0 0 3cqi ${t.numberGlow}` }}
      >
        {hero.display}
      </span>
      <span
        className="mt-[1cqi] text-[3.2cqi] font-semibold tracking-[0.1em] uppercase"
        style={{ color: t.accent }}
      >
        {hero.label}
      </span>
      {handedness && (
        <span
          className="mt-[3.5cqi] flex items-center gap-[1.5cqi] text-[4.6cqi] font-semibold"
          style={{ color: t.muted }}
        >
          <HandIcon
            aria-hidden
            className="size-[5cqi]"
            style={
              handedness === "left" ? { transform: "scaleX(-1)" } : undefined
            }
          />
          {handedness === "left" ? "LH" : "RH"}
          <span className="sr-only"> ({HANDEDNESS_LABELS[handedness]})</span>
        </span>
      )}
    </div>
  )
  // the photo bleeds to the card's top and right edges (feathered on every
  // side, so no hard corners), which is why the content has no top/right
  // padding around it
  const avatar = (
    <div
      role="img"
      aria-label={`${name}'s photo`}
      className="h-[54cqi] min-w-0 flex-1 self-start bg-cover bg-top bg-no-repeat"
      style={{
        // the feather overlay sits on top of the photo (first layer wins)
        backgroundImage: `${t.feather}, url(${avatarSrc})`,
        WebkitMaskImage: AVATAR_MASK,
        maskImage: AVATAR_MASK,
      }}
    />
  )

  return (
    // the @container lives on this wrapper (not the shell) so the border can
    // also be a cqi value — otherwise the shell can't query its own width and
    // the border would be the one thing that isn't proportional to the card
    <div className="@container">
      <div
        className="relative"
        style={{ clipPath: SHIELD, backgroundColor: t.border, padding: "0.8cqi" }}
      >
        <div
          className="relative"
          style={{ clipPath: SHIELD, backgroundColor: t.bg }}
        >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 62% at ${t.glowAt}, ${t.glow}, transparent 62%)`,
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(116deg, transparent 44%, rgba(255,255,255,0.09) 50%, transparent 56%)",
          }}
        />
        <div className="relative pb-[13cqi]">
        <div className="flex items-start gap-[6cqi]">
          <div className="shrink-0 pt-[8cqi] pl-[8cqi]">{stats}</div>
          {avatar}
        </div>

        <div className="px-[7cqi]">
        <div className="mt-[2cqi] text-center">
          <p className="truncate text-[10cqi] font-extrabold tracking-wide text-white uppercase">
            {name}
          </p>
        </div>

        <div
          className="mx-[2cqi] mt-[4cqi] mb-[3cqi] h-[0.8cqi]"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${t.rule},0.9) 50%, transparent)`,
          }}
        />

        {trait && (
          <p
            className="mb-[4cqi] text-center text-[4.2cqi] font-bold tracking-[0.08em] uppercase"
            style={{ color: t.accentSoft }}
          >
            {TRAIT_LABELS[trait]}
          </p>
        )}

        <div className="flex justify-center gap-[8cqi]">
          <dl className="flex flex-col gap-[3.5cqi]">
            {[attrs[0], attrs[2], attrs[4]].map(stat)}
          </dl>
          <div
            className="w-px self-stretch"
            style={{ backgroundColor: `rgba(${t.rule},0.35)` }}
          />
          <dl className="flex flex-col gap-[3.5cqi]">
            {[attrs[1], attrs[3], attrs[5]].map(stat)}
          </dl>
        </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  )
}

/** The two flourishes under a card: trait line + earned pills. */
export function DuelCardFooter({
  name,
  trait,
  pills,
}: {
  name: string
  trait: SignatureTrait | null
  pills: Array<string>
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="text-muted-foreground text-center text-xs">
        {name}
        {trait && (
          <>
            {" · "}
            <span className="font-semibold">{TRAIT_LABELS[trait]}</span>
          </>
        )}
        {" · measured"}
      </p>
      {pills.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-1.5">
          {pills.map((pill) => (
            <li
              key={pill}
              className="text-muted-foreground ring-border rounded-full px-2.5 py-0.5 text-[10px] ring-1"
            >
              {pill}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
