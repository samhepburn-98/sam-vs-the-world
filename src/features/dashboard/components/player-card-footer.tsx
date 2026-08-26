import { TRAIT_LABELS } from "@/features/dashboard/lib/player-attributes"

import type { SignatureTrait } from "@/features/dashboard/schemas/insights"

/** The two flourishes under a card: trait line + earned pills. */
export function PlayerCardFooter({
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
      <p className="text-center text-xs text-muted-foreground">
        {name}
        {trait && (
          <>
            {" · "}
            {/* earned, so it speaks in the display voice and wears gold */}
            <span className="font-heading text-[10px] font-semibold tracking-[0.14em] text-gold uppercase">
              {TRAIT_LABELS[trait]}
            </span>
          </>
        )}
        {" · measured"}
      </p>
      {pills.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-1.5">
          {pills.map((pill) => (
            <li
              key={pill}
              className="rounded-full px-2.5 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border"
            >
              {pill}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
