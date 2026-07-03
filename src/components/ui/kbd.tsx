import { createContext, useContext } from "react"

import { cn } from "@/lib/utils"

/** Whether Kbd hints render at all — toggled from the `?` dialog. The
 *  cheat sheet overrides this to true; its keys ARE the content. */
export const KbdHintsContext = createContext(true)

/** Subtle inline key hint — decoration only, never focusable. */
export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const visible = useContext(KbdHintsContext)
  if (!visible) return null
  return (
    <kbd
      aria-hidden
      className={cn(
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-4 min-w-4 items-center justify-center rounded border px-1 font-mono text-[10px]",
        className,
      )}
    >
      {children}
    </kbd>
  )
}
