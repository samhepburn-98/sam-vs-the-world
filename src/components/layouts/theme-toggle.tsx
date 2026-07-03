import { MoonIcon, SunIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { resolvePref, setThemePref, storedPref } from "@/lib/theme"

import type { ResolvedTheme } from "@/lib/theme"

// The header theme switch (#70). It flips the *resolved* theme and persists the
// choice; while the reader is still on "system" it also follows live OS changes.
// The resolved theme is only known on the client (the no-flash script sets it
// before hydration), so it renders a stable icon until mounted — same on server
// and first client render, no hydration mismatch, no layout shift on correction.

export function ThemeToggle({ className }: { className?: string }) {
  const [resolved, setResolved] = useState<ResolvedTheme | null>(null)

  useEffect(() => {
    setResolved(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    )
    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      if (storedPref() === "system") {
        setThemePref("system")
        setResolved(resolvePref("system"))
      }
    }
    mql.addEventListener("change", onChange)
    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [])

  const isDark = resolved === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={className}
      onClick={() => {
        const next = isDark ? "light" : "dark"
        setThemePref(next)
        setResolved(next)
      }}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
