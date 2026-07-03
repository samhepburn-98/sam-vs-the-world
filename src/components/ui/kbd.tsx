import { cn } from "@/lib/utils"

/** Subtle inline key hint — decoration only, never focusable. */
export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
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
