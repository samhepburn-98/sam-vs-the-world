import { cn } from "@/lib/utils"

import type { ComponentProps } from "react"

// The heading voice of the app, as composable primitives rather than a type
// scale: every page title, section title, and overline label renders through
// one of these, so the sizes can't drift between pages. The voice is Ultimate's
// display face (Chakra Petch, uppercase — rule 06: it shouts); body copy stays
// on Nunito Sans via plain Tailwind utilities.

/** Top-of-page h1 — display face, one size everywhere. */
export function PageTitle({ className, ...props }: ComponentProps<"h1">) {
  return (
    <h1
      className={cn("font-heading text-3xl font-bold uppercase", className)}
      {...props}
    />
  )
}

/** Section-level h2 inside a page. */
export function SectionTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("font-heading text-xl font-bold uppercase", className)}
      {...props}
    />
  )
}

/** Small uppercase tracked label above a block — muted by default, primary
 *  for the emphasized profile sections. Heading level is the caller's call
 *  since these sit at different depths. */
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
        "font-heading text-xs font-semibold tracking-[0.2em] uppercase",
        tone === "primary" ? "text-primary" : "text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
