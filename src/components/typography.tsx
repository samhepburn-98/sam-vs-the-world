import { cn } from "@/lib/utils"

import type { ComponentProps } from "react"

// The heading voice of the app, as composable primitives rather than a type
// scale: every page title, section title, and overline label renders through
// one of these, so the sizes can't drift between pages. The voice is
// Broadcast's condensed display face — heavy, uppercase, tight-leaded, like
// a title graphic; body copy stays on Barlow via plain Tailwind utilities.

/** Top-of-page h1 — the title graphic, one size everywhere. */
export function PageTitle({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "font-heading text-4xl leading-[0.95] font-extrabold uppercase",
        className
      )}
      {...props}
    />
  )
}

/** Section-level h2 inside a page. */
export function SectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "font-heading text-2xl leading-none font-extrabold tracking-[0.06em] uppercase",
        className
      )}
      {...props}
    />
  )
}

/** Small uppercase tracked label above a block — muted by default, primary
 *  for the emphasized sections. Heading level is the caller's call since
 *  these sit at different depths. */
export function Overline({
  as: Tag = "h3",
  tone = "muted",
  className,
  ...props
}: ComponentProps<"h3"> & {
  as?: "h2" | "h3"
  tone?: "muted" | "primary"
}) {
  return (
    <Tag
      className={cn(
        "font-heading text-sm font-bold tracking-[0.16em] uppercase",
        tone === "primary" ? "text-primary-strong" : "text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
