// Theme preference plumbing (#70). The `.dark` token palette lives in
// styles.css; this owns *which* palette is live. A preference is one of three:
// an explicit "light"/"dark", or "system" (follow prefers-color-scheme), which
// is the default until the reader chooses. The choice persists in localStorage.
//
// The class + color-scheme are applied to <html> in two places that must agree:
// the blocking no-flash script in the document head (so the first paint is
// already correct) and `applyTheme` here (for live toggles). Keep them in sync.

export type ThemePref = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

export const THEME_KEY = "theme"

/** The exact script text run synchronously in <head> before first paint, so the
 *  page never flashes the wrong palette. Mirrors resolvePref/applyResolved. */
export const NO_FLASH_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_KEY}");var d=p==="dark"||((p!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light";}catch(e){}})();`

export function storedPref(): ThemePref {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === "light" || v === "dark" ? v : "system"
  } catch {
    return "system"
  }
}

export function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false
  // matchMedia is typed as always-present but jsdom (tests) omits it
  const mm = window.matchMedia as typeof window.matchMedia | undefined
  return mm !== undefined && mm("(prefers-color-scheme: dark)").matches
}

export function resolvePref(pref: ThemePref): ResolvedTheme {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light"
  return pref
}

function applyResolved(resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved
}

/** Persist a preference and apply it live. "system" clears the stored key so a
 *  later OS change is followed again. */
export function setThemePref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, pref)
  } catch {
    // storage may be unavailable (private mode) — apply anyway for this session
  }
  applyResolved(resolvePref(pref))
}
