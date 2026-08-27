import { Link } from "@tanstack/react-router"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { humanise } from "@/features/dashboard/lib/humanise"
import { BallDots } from "@/components/broadcast/ball-dots"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type { RallyScored } from "@/lib/schemas/rally"

// The L4 view (§3.4): one rally's full detail in a slide-over, with prev/next
// through the current list and a link out to the match (L3) with the rally
// highlighted. Fed a row straight from a `*_rallies` companion.

interface RallyDetailSheetProps {
  rally: RallyScored | null
  playerId?: string
  /** Hidden on the match page itself, where "open in match" is a no-op. */
  showMatchLink?: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[8rem_1fr] items-baseline gap-2 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export function RallyDetailSheet({
  rally,
  playerId,
  showMatchLink = true,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: RallyDetailSheetProps) {
  const orientToPlayer = playerId && rally && rally.player1_id !== playerId
  const scoreLine = rally
    ? orientToPlayer
      ? `${rally.score_p2}–${rally.score_p1}`
      : `${rally.score_p1}–${rally.score_p2}`
    : ""

  return (
    <Sheet open={rally !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto">
        {rally && (
          <>
            <SheetHeader>
              <SheetTitle className="font-heading">
                Game {rally.game_number} · Rally {rally.rally_number}
              </SheetTitle>
              <SheetDescription>
                Running score after this rally: {scoreLine}.
              </SheetDescription>
            </SheetHeader>

            <dl className="divide-y divide-border px-4">
              <Field label="Outcome">
                {rally.is_let ? "Let (replayed)" : humanise(rally.end_reason)}
              </Field>
              {rally.error_detail && (
                <Field label="Detail">{humanise(rally.error_detail)}</Field>
              )}
              {rally.forced !== null && (
                <Field label="Forced">
                  {rally.forced ? "Forced" : "Unforced"}
                </Field>
              )}
              <Field label="Serve">
                {humanise(rally.serve_side)} box · serve {rally.serve_number}
              </Field>
              {rally.shot_count !== null && (
                <Field label="Shots">{rally.shot_count}</Field>
              )}
              {rally.ball_type && (
                <Field label="Ball">
                  <span className="flex items-center gap-1.5">
                    <BallDots ball={rally.ball_type} />
                    {humanise(rally.ball_type)}
                  </span>
                </Field>
              )}
            </dl>

            <SheetFooter className="mt-auto">
              {showMatchLink && rally.match_id && rally.id && (
                <Button asChild variant="outline">
                  <Link
                    to="/matches/$matchId"
                    params={{ matchId: rally.match_id }}
                    search={{ rally: rally.id }}
                  >
                    Open in match
                  </Link>
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  disabled={!hasPrev}
                  onClick={onPrev}
                >
                  <ChevronLeftIcon /> Previous
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  disabled={!hasNext}
                  onClick={onNext}
                >
                  Next <ChevronRightIcon />
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
