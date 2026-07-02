export function getSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      "Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY — copy .env.example to .env and fill in the values from the Supabase dashboard.",
    )
  }

  return { url, key }
}
