// Turn a stored enum value into a label: "serve_fault" → "Serve fault".
export function humanise(value: string): string {
  const spaced = value.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/** The match's format as a badge label: a null format is a casual session,
 *  anything else is a best-of. */
export function formatLabel(format: number | null): string {
  return format === null ? "Casual" : `Best of ${format}`
}
