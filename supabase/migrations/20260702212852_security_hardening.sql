-- pin search_path on all our functions (advisor lint 0011); table refs inside are schema-qualified
alter function public.set_updated_at() set search_path = '';
alter function public.rallies_validate_players() set search_path = '';
alter function public.matches_validate_player_change() set search_path = '';

-- is_owner() must not be publicly executable via /rpc (lints 0028/0029).
-- authenticated KEEPS execute: RLS policies evaluate it as the querying role.
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

-- Supabase's own rls_auto_enable() event-trigger helper needs no API exposure
-- either. It exists on cloud projects only (platform-provisioned), so guard it
-- for local/test stacks — prod already ran the unconditional form.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
