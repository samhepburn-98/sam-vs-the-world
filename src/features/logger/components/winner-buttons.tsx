import { forwardRef } from "react"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { HOTKEY_HINTS } from "@/features/logger/lib/hotkeys"
import { cn } from "@/lib/utils"

// The primary action: who won the rally — a real single-choice group, with
// the slim let between the two sides (a let saves immediately, no chips, so
// it stays a plain action button). Both sides start prominent; once a winner
// is tapped the other side recedes, and tapping it switches the winner
// (misclick correction).

interface WinnerButtonsProps {
  p1Name: string
  p2Name: string
  selected: "p1" | "p2" | null
  onWinner: (side: "p1" | "p2") => void
  onLet: () => void
}

export const WinnerButtons = forwardRef<HTMLDivElement, WinnerButtonsProps>(
  function WinnerButtons({ p1Name, p2Name, selected, onWinner, onLet }, ref) {
    // each button wears its player's colour — ember left, blue right — the
    // same convention as the score above it
    const winnerItem = (side: "p1" | "p2", name: string) => (
      <ToggleGroupItem
        value={side}
        className={cn(
          "h-16 min-w-0 px-2 font-heading text-sm leading-tight tracking-wide whitespace-normal uppercase group-has-data-[state=on]/winners:data-[state=off]:border group-has-data-[state=on]/winners:data-[state=off]:border-input group-has-data-[state=on]/winners:data-[state=off]:bg-background group-has-data-[state=on]/winners:data-[state=off]:text-foreground group-has-data-[state=on]/winners:data-[state=off]:opacity-60 data-[state=on]:ring-2 data-[state=on]:ring-offset-2 sm:px-6 sm:text-base",
          side === "p1"
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:ring-primary/50"
            : "bg-p2 text-white hover:bg-p2/90 hover:text-white data-[state=on]:bg-p2 data-[state=on]:text-white data-[state=on]:ring-p2/50"
        )}
        onClick={() => onWinner(side)}
      >
        <Kbd>
          {side === "p1" ? HOTKEY_HINTS.winnerP1 : HOTKEY_HINTS.winnerP2}
        </Kbd>
        {name} won
        {selected === side && <span aria-hidden>✓</span>}
      </ToggleGroupItem>
    )

    return (
      <ToggleGroup
        ref={ref}
        type="single"
        tabIndex={-1}
        aria-label="Who won the rally"
        value={selected ?? ""}
        className="group/winners grid w-full grid-cols-[1fr_auto_1fr] gap-2 outline-none"
      >
        {winnerItem("p1", p1Name)}
        <Button
          type="button"
          variant="outline"
          className="aspect-square h-16 flex-col gap-0.5 text-base font-bold tracking-wide uppercase"
          onClick={onLet}
        >
          <Kbd>{HOTKEY_HINTS.let}</Kbd>
          Let
        </Button>
        {winnerItem("p2", p2Name)}
      </ToggleGroup>
    )
  }
)
