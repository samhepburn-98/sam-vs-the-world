import { forwardRef } from "react"

import { Button } from "@/components/ui/button"

// The primary action (§5.3): two big buttons — who won the rally — with the
// slim let between them (a let saves immediately, no chips).

interface WinnerButtonsProps {
  p1Name: string
  p2Name: string
  onWinner: (side: "p1" | "p2") => void
  onLet: () => void
}

export const WinnerButtons = forwardRef<HTMLDivElement, WinnerButtonsProps>(
  function WinnerButtons({ p1Name, p2Name, onWinner, onLet }, ref) {
    return (
      <div
        ref={ref}
        tabIndex={-1}
        className="grid grid-cols-[1fr_auto_1fr] gap-2 outline-none"
      >
        <Button
          type="button"
          size="lg"
          className="h-16 text-base font-bold tracking-wide uppercase"
          onClick={() => onWinner("p1")}
        >
          {p1Name} won
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-16 px-3 text-xs"
          onClick={onLet}
        >
          Let
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="h-16 text-base font-bold tracking-wide uppercase"
          onClick={() => onWinner("p2")}
        >
          {p2Name} won
        </Button>
      </div>
    )
  },
)
