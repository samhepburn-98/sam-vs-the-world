import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import type { PlayerSummary } from "@/lib/schemas/player"

// The duel setup: two player slots facing off across a VS, then the scope
// toggle. The slots echo the cards below (player one hot, player two cool),
// so choosing feels like assembling the matchup.

const SLOT_STYLES = {
  p1: {
    ring: "ring-primary/40",
    chip: "bg-primary/12 text-primary",
  },
  p2: {
    ring: "ring-[color-mix(in_oklab,var(--p2)_40%,transparent)]",
    chip: "bg-[color-mix(in_oklab,var(--p2)_14%,transparent)] text-[var(--p2-strong)]",
  },
} as const

function PlayerSlot({
  side,
  value,
  options,
  onPick,
}: {
  side: "p1" | "p2"
  value: string | undefined
  options: Array<PlayerSummary>
  onPick: (id: string) => void
}) {
  const s = SLOT_STYLES[side]
  const chosen = Boolean(value)
  return (
    <Select value={value ?? ""} onValueChange={onPick}>
      <SelectTrigger
        aria-label={side === "p1" ? "Player one" : "Player two"}
        className={cn(
          "h-11 w-40 justify-start gap-2.5 rounded-2xl px-3 sm:w-48 [&>span]:min-w-0 [&>span]:flex-1",
          chosen && `ring-2 ${s.ring}`
        )}
      >
        <SelectValue placeholder="Choose a player" />
      </SelectTrigger>
      <SelectContent>
        {options.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <span className="flex items-center gap-2.5">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt=""
                  className="size-7 shrink-0 rounded-full bg-muted object-cover"
                />
              ) : (
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    s.chip
                  )}
                >
                  {p.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="truncate text-sm font-medium">{p.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function DuelPicker({
  roster,
  selected,
  onPick,
}: {
  roster: Array<PlayerSummary>
  selected: Array<string>
  onPick: (index: number, id: string) => void
}) {
  // each slot can pick anyone except whoever fills the other slot
  const optionsFor = (i: number) =>
    roster.filter((p) => p.id !== selected[i === 0 ? 1 : 0])

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <PlayerSlot
        side="p1"
        value={selected[0]}
        options={optionsFor(0)}
        onPick={(id) => onPick(0, id)}
      />
      <span className="font-heading text-sm font-semibold text-muted-foreground">
        vs
      </span>
      <PlayerSlot
        side="p2"
        value={selected[1]}
        options={optionsFor(1)}
        onPick={(id) => onPick(1, id)}
      />
    </div>
  )
}
