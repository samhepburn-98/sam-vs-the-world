import { forwardRef } from "react"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { HOTKEY_HINTS } from "@/lib/logger/hotkeys"
import { cn } from "@/lib/utils"

// The primary action (§5.3): two big buttons — who won the rally — with the
// slim let between them (a let saves immediately, no chips). Once a winner is
// tapped that button stays visibly pressed; tapping the other side switches
// the winner (misclick correction).

interface WinnerButtonsProps {
  p1Name: string
  p2Name: string
  selected: "p1" | "p2" | null
  onWinner: (side: "p1" | "p2") => void
  onLet: () => void
}

export const WinnerButtons = forwardRef<HTMLDivElement, WinnerButtonsProps>(
  function WinnerButtons({ p1Name, p2Name, selected, onWinner, onLet }, ref) {
    const winnerButton = (side: "p1" | "p2", name: string) => (
      <Button
        type="button"
        size="lg"
        variant={selected === null || selected === side ? "default" : "outline"}
        aria-pressed={selected === side}
        className={cn(
          "h-16 text-base font-bold tracking-wide uppercase",
          selected === side && "ring-primary/50 ring-2 ring-offset-2",
          selected !== null && selected !== side && "opacity-60",
        )}
        onClick={() => onWinner(side)}
      >
        <Kbd>{side === "p1" ? HOTKEY_HINTS.winnerP1 : HOTKEY_HINTS.winnerP2}</Kbd>
        {name} won
        {selected === side && <span aria-hidden>✓</span>}
      </Button>
    )

    return (
      <div
        ref={ref}
        tabIndex={-1}
        className="grid grid-cols-[1fr_auto_1fr] gap-2 outline-none"
      >
        {winnerButton("p1", p1Name)}
        <Button
          type="button"
          variant="outline"
          className="h-16 px-3 text-xs"
          onClick={onLet}
        >
          <Kbd>{HOTKEY_HINTS.let}</Kbd>
          Let
        </Button>
        {winnerButton("p2", p2Name)}
      </div>
    )
  },
)
