import { TRAIT_LABELS } from "@/features/dashboard/lib/duel-attributes"

import type { DuelAttribute } from "@/features/dashboard/lib/duel-attributes"
import type { SignatureTrait } from "@/features/dashboard/schemas/insights"
import type { Handedness } from "@/lib/schemas/enums"

// The FUT-style player card (§5.1 redesign). A physical collectible object,
// so its dark scene colours are hardcoded — the card looks the same in light
// and dark mode rather than inverting. Player one runs hot (gold/orange),
// player two cool (silver/blue), matching the app's p1/p2 convention. The
// foil sheen, glow, crest, and gradient rule are what make it read as a
// premium card and not a stat panel.

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
  },
} as const

const HANDEDNESS_LABELS: Record<Handedness, string> = {
  left: "Left-handed",
  right: "Right-handed",
}

// feather the avatar into the card on every edge — no container box, the
// figure just dissolves into the dark ground like the FUT photo treatment
const AVATAR_MASK =
  "radial-gradient(105% 96% at 50% 40%, #000 42%, transparent 78%)"

function Crest({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 640 975" width="22" fill="none" aria-hidden>
      <g stroke={color} strokeWidth={44} strokeLinejoin="round">
        <rect x={22} y={22} width={596} height={931} rx={16} />
        <line x1={0} y1={544} x2={640} y2={544} />
        <line x1={320} y1={544} x2={320} y2={953} />
      </g>
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
  // the player's standout attribute wears the accent — every card gets a
  // different hero row, like a real deck
  const best = attrs.reduce<DuelAttribute | null>(
    (acc, a) =>
      a.value !== null && (acc?.value == null || a.value > acc.value) ? a : acc,
    null,
  )

  const stats = (
    <div className="flex w-14 flex-col items-center text-center">
      <span
        className="text-4xl leading-none font-extrabold"
        style={{ color: t.accent, textShadow: `0 0 16px ${t.numberGlow}` }}
      >
        {hero.display}
      </span>
      <span
        className="mt-1 text-[8px] font-medium tracking-[0.1em] uppercase"
        style={{ color: t.accent }}
      >
        {hero.label}
      </span>
      {trait && (
        <span
          className="mt-2.5 text-[10px] font-bold tracking-[0.08em] uppercase"
          style={{ color: t.accentSoft }}
        >
          {TRAIT_LABELS[trait]}
        </span>
      )}
      <span className="mt-2.5">
        <Crest color={t.accent} />
      </span>
    </div>
  )
  const avatar = (
    <img
      src={avatarSrc}
      alt=""
      className="h-36 w-36 min-w-0 flex-1 self-end object-contain object-bottom"
      style={{ WebkitMaskImage: AVATAR_MASK, maskImage: AVATAR_MASK }}
    />
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
      <div className="relative p-5">
        <div className="flex items-end gap-2">
          {side === "p1" ? (
            <>
              {stats}
              {avatar}
            </>
          ) : (
            <>
              {avatar}
              {stats}
            </>
          )}
        </div>

        <div className="mt-2 text-center">
          <p className="truncate text-2xl font-extrabold tracking-wide text-white uppercase">
            {name}
          </p>
          {handedness && (
            <p className="mt-0.5 text-[11px]" style={{ color: t.muted }}>
              {HANDEDNESS_LABELS[handedness]}
            </p>
          )}
        </div>

        <div
          className="mx-1 my-4 h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${t.rule},0.9) 50%, transparent)`,
          }}
        />

        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 px-1.5">
          {attrs.map((a) => {
            const isBest = best !== null && a.key === best.key
            return (
              <div key={a.key} className="flex items-baseline gap-2">
                <dd
                  className="text-base font-extrabold tabular-nums"
                  style={{ color: isBest ? t.accent : "#ffffff" }}
                >
                  {a.display}
                </dd>
                <dt
                  className="text-[11px] tracking-[0.06em]"
                  style={{ color: isBest ? t.accentSoft : t.muted }}
                >
                  {a.code}
                  <span className="sr-only">
                    {" "}
                    — {a.detail}: {a.sr}
                  </span>
                </dt>
              </div>
            )
          })}
        </dl>
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
      <p className="text-muted-foreground text-xs">
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
