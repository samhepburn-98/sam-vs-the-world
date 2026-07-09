import { TRAIT_LABELS } from "@/features/dashboard/lib/duel-attributes"

import type {
  DuelAttribute,
  PlayerData,
} from "@/features/dashboard/lib/duel-attributes"
import type { SignatureTrait } from "@/features/dashboard/schemas/insights"
import type { Handedness } from "@/lib/schemas/enums"

// The FUT-style player card (§5.1 redesign). A physical collectible object,
// so its dark scene colours are hardcoded — the card looks the same in light
// and dark mode rather than inverting. Player one runs hot (gold/orange),
// player two cool (silver/blue), matching the app's p1/p2 convention.

const THEMES = {
  p1: {
    border: "#F5B841",
    glow: "rgba(234,88,12,0.5)",
    glowAt: "55% 16%",
    bg: "#130f0e",
    well: "#2a2320",
    accent: "#F5B841",
    accentSoft: "#f5d9a8",
    muted: "#c9b79c",
    rule: "rgba(245,184,65,0.35)",
  },
  p2: {
    border: "#C7CCD4",
    glow: "rgba(59,130,246,0.5)",
    glowAt: "45% 16%",
    bg: "#0d1018",
    well: "#1c2230",
    accent: "#93C5FD",
    accentSoft: "#bcd6f7",
    muted: "#aab4c4",
    rule: "rgba(199,204,212,0.3)",
  },
} as const

const HANDEDNESS_LABELS: Record<Handedness, string> = {
  left: "Left-handed",
  right: "Right-handed",
}

const AVATAR_MASK =
  "radial-gradient(120% 92% at 50% 32%, #000 46%, transparent 80%)"

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
  // the player's standout attribute wears the accent — every card gets a
  // different hero row, like a real deck
  const best = attrs.reduce<DuelAttribute | null>(
    (acc, a) =>
      a.value !== null && (acc?.value == null || a.value > acc.value) ? a : acc,
    null,
  )
  const statsBlock = (
    <div className="flex w-11 flex-col items-center text-center">
      <span
        className="text-2xl leading-none font-extrabold"
        style={{ color: t.accent }}
      >
        {hero.display}
      </span>
      <span
        className="mt-0.5 text-[7px] font-medium tracking-[0.08em] uppercase"
        style={{ color: t.accent }}
      >
        {hero.label}
      </span>
      {trait && (
        <span
          className="mt-1.5 text-[8px] font-bold tracking-[0.08em] uppercase"
          style={{ color: t.accentSoft }}
        >
          {TRAIT_LABELS[trait]}
        </span>
      )}
    </div>
  )
  const avatar = (
    <div
      className="h-24 min-w-0 flex-1"
      style={{ WebkitMaskImage: AVATAR_MASK, maskImage: AVATAR_MASK }}
    >
      <div
        className="flex size-full items-end justify-center"
        style={{ backgroundColor: t.well }}
      >
        <img src={avatarSrc} alt="" className="w-24 max-w-full" />
      </div>
    </div>
  )

  return (
    <div
      className="relative overflow-hidden rounded-2xl border-2"
      style={{ backgroundColor: t.bg, borderColor: t.border }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 60% at ${t.glowAt}, ${t.glow}, transparent 60%)`,
        }}
      />
      <div className="relative p-2.5">
        <div className="flex items-end gap-1">
          {side === "p1" ? (
            <>
              {statsBlock}
              {avatar}
            </>
          ) : (
            <>
              {avatar}
              {statsBlock}
            </>
          )}
        </div>

        <div className="mt-0.5 text-center">
          <p className="truncate text-lg font-extrabold tracking-wide text-white uppercase">
            {name}
          </p>
          {handedness && (
            <p className="text-[10px]" style={{ color: t.muted }}>
              {HANDEDNESS_LABELS[handedness]}
            </p>
          )}
        </div>

        <div className="mx-1 my-1.5 h-px" style={{ backgroundColor: t.rule }} />

        <dl className="grid grid-cols-2 gap-x-2.5 gap-y-1 px-1">
          {attrs.map((a) => {
            const isBest = best !== null && a.key === best.key
            return (
              <div key={a.key} className="flex items-baseline gap-1.5">
                <dd
                  className="text-[13px] font-extrabold tabular-nums"
                  style={{ color: isBest ? t.accent : "#ffffff" }}
                >
                  {a.display}
                </dd>
                <dt
                  className="text-[9px] tracking-[0.06em]"
                  style={{ color: isBest ? t.accentSoft : t.muted }}
                >
                  {a.code}
                  <span className="sr-only"> — {a.detail}: {a.sr}</span>
                </dt>
              </div>
            )
          })}
        </dl>
      </div>
    </div>
  )
}

/** The two decorative flourishes under a card: trait line + earned pills. */
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
      <p className="text-muted-foreground text-[10px]">
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
        <ul className="flex flex-wrap justify-center gap-1">
          {pills.map((pill) => (
            <li
              key={pill}
              className="text-muted-foreground ring-border rounded-full px-2 py-0.5 text-[9px] ring-1"
            >
              {pill}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Convenience: the trait straight off the headline payload. */
export function traitOf(d: PlayerData): SignatureTrait | null {
  return d.headline?.signature_trait ?? null
}
