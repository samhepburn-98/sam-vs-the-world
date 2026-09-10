import { createFileRoute } from "@tanstack/react-router"
import { Fragment } from "react"

import {
  TRAIT_KEYS,
  TRAIT_META,
  traitAt,
} from "@/features/dashboard/lib/player-attributes"
import type {
  TraitAgency,
  TraitTempo,
} from "@/features/dashboard/lib/player-attributes"
import { Overline, PageTitle, SectionTitle } from "@/components/typography"
import { cn } from "@/lib/utils"

// The trait reference (§3.2): the in-app explanation of the 3×3 signature
// trait matrix, so nobody has to remember what a Grafter is. Single-sourced
// from TRAIT_META — the page can't drift from what the cards display.

export const Route = createFileRoute("/traits")({
  component: TraitsPage,
})

const TEMPO_ROWS: Array<{ key: TraitTempo; label: string; detail: string }> = [
  { key: "short", label: "Short-court", detail: "points end inside 3 shots" },
  { key: "all", label: "All-court", detail: "no lean either way" },
  { key: "long", label: "Long-court", detail: "points run 5+ shots" },
]

const AGENCY_COLS: Array<{ key: TraitAgency; label: string; detail: string }> =
  [
    { key: "finisher", label: "Finisher", detail: "their own clean winners" },
    { key: "mixed", label: "Mixed", detail: "a bit of both" },
    { key: "pressure", label: "Pressure", detail: "the opponent cracks" },
  ]

function TraitsPage() {
  return (
    <main className="container mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10">
      <header>
        <PageTitle>Traits</PageTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          The class line on every player card — nine identities, measured from
          real rallies, never assigned by opinion.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <SectionTitle>The two axes</SectionTitle>
        <p className="text-sm text-muted-foreground">
          A trait is where a player lands on two measured axes.{" "}
          <span className="font-medium text-foreground">Tempo</span> (rows) is
          where the game lives: win rate in short rallies (1–3 shots) against
          win rate in extended rallies (5+ shots). A lean of eight points or
          more marks a short- or long-court player.{" "}
          <span className="font-medium text-foreground">Agency</span> (columns)
          is whose racket ends the points a player wins: the share ended by
          their own clean winner or ace, against those handed over by the
          opponent&rsquo;s error. 55% or more marks a finisher; 43% or less, a
          pressure player.
        </p>
        <p className="text-sm text-muted-foreground">
          Reading the grid: left to right, the winning racket shifts from yours
          to theirs. Top to bottom, the points live longer.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>The grid</SectionTitle>
        <div className="grid grid-cols-[auto_repeat(3,1fr)] gap-1.5 text-center">
          <div />
          {AGENCY_COLS.map((c) => (
            <div key={c.key} className="px-1 py-2">
              <Overline as="h3">{c.label}</Overline>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                {c.detail}
              </p>
            </div>
          ))}
          {TEMPO_ROWS.map((r) => (
            <Fragment key={r.key}>
              <div className="flex flex-col justify-center pr-2 text-left">
                <Overline as="h3">{r.label}</Overline>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  {r.detail}
                </p>
              </div>
              {AGENCY_COLS.map((c) => {
                const key = traitAt(r.key, c.key)
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-center rounded-xl bg-card px-2 py-5 ring-1 ring-foreground/10",
                      key === "all_rounder" && "bg-muted/50"
                    )}
                  >
                    <span className="font-heading text-sm font-bold tracking-wide uppercase sm:text-base">
                      {TRAIT_META[key].label}
                    </span>
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>The nine traits</SectionTitle>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {TRAIT_KEYS.map((key) => (
            <div key={key}>
              <dt className="font-heading text-sm font-bold">
                {TRAIT_META[key].label}
              </dt>
              <dd className="text-sm text-muted-foreground">
                {TRAIT_META[key].blurb}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>How a trait is earned</SectionTitle>
        <p className="text-sm text-muted-foreground">
          Traits are computed from every logged rally, and only when there is
          enough play to be fair: at least 30 short rallies, 30 extended
          rallies, and 30 points won. Until then a player carries no trait at
          all — a missing label is more honest than an invented one. Every trait
          comes with its receipts: the signature line under a player&rsquo;s
          name cites the win rates that earned it.
        </p>
      </section>
    </main>
  )
}
