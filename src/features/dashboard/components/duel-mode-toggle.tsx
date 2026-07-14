import { cn } from "@/lib/utils"

// The comparison-scope toggle: "all games" reads each player's overall form,
// "head to head" scopes every stat to their shared games. A segmented
// control rather than a button pair, so the active scope is always visible.

export function DuelModeToggle({
  mode,
  onChange,
}: {
  mode: "all" | "h2h"
  onChange: (mode: "all" | "h2h") => void
}) {
  const options: Array<{ value: "all" | "h2h"; label: string }> = [
    { value: "all", label: "All games" },
    { value: "h2h", label: "Head to head" },
  ]
  return (
    <div
      role="tablist"
      aria-label="Comparison scope"
      className="inline-flex items-center gap-1 rounded-full bg-muted p-1"
    >
      {options.map((o) => {
        const active = mode === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
