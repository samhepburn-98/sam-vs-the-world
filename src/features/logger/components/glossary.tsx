import { Fragment } from "react"

import { LoggerDialog } from "@/features/logger/components/logger-dialog"
import { Constants } from "@/lib/database.types"
import { LOGGABLE_ERROR_DETAILS } from "@/lib/schemas/enums"

import type { EndReason, ErrorDetail } from "@/lib/schemas/enums"

// One-line reminders of what the chips mean (§2 definitions). The same
// records feed the chips' hover titles and the glossary dialog.

export const END_REASON_HELP: Record<EndReason, string> = {
  winner: "Opponent didn't get a racket on it — a clean winner.",
  error: "Opponent hit it but didn't return it to the front wall.",
  stroke: "Point awarded for interference; nobody hit an error.",
  let: "Rally replayed — no point either way.",
  ace: "Unreturnable serve; the server wins the point outright.",
  serve_fault: "The serve itself ended the point (a 2nd-serve fault = double fault).",
}

export const ERROR_DETAIL_HELP: Record<ErrorDetail, string> = {
  tin: "Hit the tin.",
  out_top: "Out above the front-wall line.",
  out_side: "Out on a side wall.",
  out_back: "Out at the back.",
  not_up: "Reached it, but it never made the front wall.",
  double_bounce: "Didn't get there — second bounce (or missed it).",
}

const END_REASON_LABELS: Record<EndReason, string> = {
  winner: "Winner",
  error: "Error",
  stroke: "Stroke",
  let: "Let",
  ace: "Ace",
  serve_fault: "Serve fault",
}

const ERROR_DETAIL_LABELS: Record<ErrorDetail, string> = {
  tin: "Tin",
  out_top: "Out top",
  out_side: "Out side",
  out_back: "Out back",
  not_up: "Not up",
  double_bounce: "Dbl bounce",
}

interface GlossaryProps {
  open: boolean
  onClose: () => void
}

export function Glossary({ open, onClose }: GlossaryProps) {
  return (
    <LoggerDialog open={open} title="What the chips mean" onClose={onClose}>
      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs tracking-widest uppercase">
            How the rally ended
          </h3>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
            {Constants.public.Enums.end_reason.map((r) => (
              <Fragment key={r}>
                <dt className="font-medium">{END_REASON_LABELS[r]}</dt>
                <dd className="text-muted-foreground">{END_REASON_HELP[r]}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
        <section>
          <h3 className="text-muted-foreground mb-2 text-xs tracking-widest uppercase">
            Error detail
          </h3>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-sm">
            {LOGGABLE_ERROR_DETAILS.map((d) => (
              <Fragment key={d}>
                <dt className="font-medium">{ERROR_DETAIL_LABELS[d]}</dt>
                <dd className="text-muted-foreground">{ERROR_DETAIL_HELP[d]}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-6 border-t pt-4">
        <h3 className="text-muted-foreground mb-2 text-xs tracking-widest uppercase">
          Good to know
        </h3>
        <dl className="grid gap-x-3 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
          <dt className="font-medium">Forced / unforced</dt>
          <dd className="text-muted-foreground">
            Only on errors, and optional — leave it blank when unsure. Ask: would
            they make that shot nine times out of ten with no pressure? If yes,
            it&rsquo;s unforced; if the opponent&rsquo;s shot forced the miss,
            it&rsquo;s forced.
          </dd>
          <dt className="mt-2 font-medium sm:mt-0">Shots</dt>
          <dd className="text-muted-foreground">
            The rally length. Count every shot a racket touched, including the
            last one that ended the rally — so a serve plus a failed return is
            two.
          </dd>
        </dl>
      </section>
    </LoggerDialog>
  )
}
