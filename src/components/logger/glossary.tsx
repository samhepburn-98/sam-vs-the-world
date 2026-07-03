import { Fragment } from "react"

import { LoggerDialog } from "@/components/logger/logger-dialog"
import { Constants } from "@/lib/database.types"

import type { EndReason, ErrorDetail } from "@/lib/schemas/enums"

// One-line reminders of what the chips mean (§2 definitions). The same
// records feed the chips' hover titles and the glossary dialog.

export const END_REASON_HELP: Record<EndReason, string> = {
  winner: "clean winning shot the opponent couldn't return",
  error: "the loser hit it down or out — pick the detail below",
  stroke: "point awarded for interference; nobody hit an error",
  let: "rally replayed — no point either way",
  ace: "unreturnable serve; the server wins the point outright",
  serve_fault: "the serve itself ended the point (2nd-serve fault = double fault)",
}

export const ERROR_DETAIL_HELP: Record<ErrorDetail, string> = {
  tin: "hit the tin",
  out_top: "out above the front-wall line",
  out_side: "out on a side wall",
  out_back: "out at the back",
  not_up: "reached it, but it never made the front wall",
  double_bounce: "didn't get there — second bounce (or missed it)",
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
            {Constants.public.Enums.error_detail.map((d) => (
              <Fragment key={d}>
                <dt className="font-medium">{ERROR_DETAIL_LABELS[d]}</dt>
                <dd className="text-muted-foreground">{ERROR_DETAIL_HELP[d]}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
      </div>
    </LoggerDialog>
  )
}
