// Turn a stored enum value into a label: "serve_fault" → "Serve fault".
export function humanise(value: string): string {
  const spaced = value.replace(/_/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
