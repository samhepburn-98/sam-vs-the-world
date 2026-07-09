import { DUEL_GLOSSARY } from "@/features/dashboard/lib/duel-attributes"

// The stats glossary (§5.1 redesign): the six attribute codes are terse by
// design — this spells each one out and says exactly how it's measured, so
// nothing on the duel is a black box. Single-sourced from DUEL_GLOSSARY.

export function DuelGlossary() {
  return (
    <section className="rounded-2xl border p-5">
      <h2 className="font-heading text-base font-bold">What the stats mean</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Every attribute is a measured win rate from your logged rallies — no
        invented ratings. A dash means there aren&rsquo;t enough games to be
        fair yet.
      </p>
      <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {DUEL_GLOSSARY.map((g) => (
          <div key={g.key} className="flex gap-3">
            <dt className="text-muted-foreground w-10 shrink-0 pt-0.5 text-xs font-semibold tracking-[0.06em]">
              {g.code}
            </dt>
            <dd>
              <p className="text-sm font-medium">{g.name}</p>
              <p className="text-muted-foreground text-sm">{g.how}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
