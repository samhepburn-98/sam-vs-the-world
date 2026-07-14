import { GOLDEN_USER, LOCAL_SUPABASE_URL, serviceClient } from "./local-stack"

// Seeds the local stack for the golden path: the test user (owner in
// app_admins) exists, and the data tables start empty. Idempotent — safe to
// re-run without `supabase db reset`.

export default async function globalSetup() {
  try {
    const health = await fetch(`${LOCAL_SUPABASE_URL}/auth/v1/health`)
    if (!health.ok) throw new Error(`auth health ${health.status}`)
  } catch (cause) {
    throw new Error(
      "Local Supabase stack is not running — start it with `supabase start` " +
        "(the golden path never touches the cloud project).",
      { cause }
    )
  }

  const admin = serviceClient()

  // find-or-create the owner test user
  const created = await admin.auth.admin.createUser({
    email: GOLDEN_USER.email,
    password: GOLDEN_USER.password,
    email_confirm: true,
  })
  let userId = created.data.user?.id
  if (!userId) {
    const { data, error } = await admin.auth.admin.listUsers()
    if (error) throw error
    userId = data.users.find((u) => u.email === GOLDEN_USER.email)?.id
    if (!userId)
      throw new Error("could not create or find the golden test user")
  }

  const seeded = await admin
    .from("app_admins")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
  if (seeded.error) throw seeded.error

  // a clean slate: matches cascade to games and rallies
  const wipedMatches = await admin
    .from("matches")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
  if (wipedMatches.error) throw wipedMatches.error
  const wipedPlayers = await admin
    .from("players")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
  if (wipedPlayers.error) throw wipedPlayers.error
}
