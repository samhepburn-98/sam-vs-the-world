import type { ReactNode } from "react"

// One titled band of a profile tab: the uppercase primary heading, a
// one-line lede that reads the section's data, then whatever the section
// draws. Shared by the Summary and Matches tabs so every band opens the
// same way.

export function ProfileSection({
  title,
  lede,
  children,
}: {
  title: string
  lede: string
  children: ReactNode
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-widest text-primary uppercase">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{lede}</p>
      </div>
      {children}
    </section>
  )
}

/** The tabs' shared card shell — sections that draw inside a panel use it. */
export const PROFILE_PANEL =
  "bg-card text-card-foreground ring-foreground/10 rounded-2xl p-5 ring-1"
