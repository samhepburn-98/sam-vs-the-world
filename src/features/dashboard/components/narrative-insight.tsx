import { cn } from "@/lib/utils"

import type { ProfileInsight } from "@/features/dashboard/lib/profile-fixture"

// A narrative insight card: an eyebrow naming the kind of finding, a
// one-line thesis, and a short body with the numbers inline. The Summary tab
// pairs a group of these with each visual so the chart never has to explain
// itself. At most one per group is highlighted — the one worth acting on.

export function NarrativeInsight({ insight }: { insight: ProfileInsight }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10",
        insight.highlight && "bg-primary/5 ring-primary/40"
      )}
    >
      <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        {insight.eyebrow}
      </p>
      <h3 className="mt-1.5 font-semibold">{insight.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{insight.body}</p>
    </div>
  )
}
