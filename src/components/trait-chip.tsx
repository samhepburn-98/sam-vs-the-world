import { cn } from "@/lib/utils"

import type { ComponentProps } from "react"

// The gold marker for things the data awarded (rule 05): a signature trait,
// a verdict. Display face, uppercase, gold — and only ever fed an earned
// label. It never decorates chrome, and it takes plain children so shared
// code stays ignorant of the trait model.

export function TraitChip({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-gold/10 px-2 py-0.5 font-heading text-[11px] font-semibold tracking-[0.14em] text-gold uppercase ring-1 ring-gold/40",
        className
      )}
      {...props}
    />
  )
}
