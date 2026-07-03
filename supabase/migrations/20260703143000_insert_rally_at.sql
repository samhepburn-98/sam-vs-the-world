-- Insert a missed rally at position k, renumbering the later rallies of the
-- same game inside one transaction — the DEFERRABLE unique constraint on
-- (game_id, rally_number) exists for exactly this (§5.4). PostgREST can't
-- span statements in a transaction, so the operation lives here.
--
-- SECURITY INVOKER (the default): runs as the calling role, so RLS decides
-- who can write — same as any direct insert/update.

create or replace function public.insert_rally_at(
  p_id            uuid,
  p_game_id       uuid,
  p_rally_number  smallint,
  p_server_id     uuid,
  p_serve_side    public.serve_side,
  p_serve_number  smallint,
  p_winner_id     uuid,
  p_end_reason    public.end_reason,
  p_error_detail  public.error_detail default null,
  p_forced        boolean default null,
  p_shot_type     public.shot_type default null,
  p_shot_count    smallint default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
begin
  if p_rally_number < 1 then
    raise exception 'rally_number must be positive';
  end if;

  set constraints public.rallies_game_number_uniq deferred;

  update public.rallies
     set rally_number = rally_number + 1
   where game_id = p_game_id
     and rally_number >= p_rally_number;

  insert into public.rallies (
    id, game_id, rally_number, server_id, serve_side, serve_number,
    winner_id, end_reason, error_detail, forced, shot_type, shot_count
  ) values (
    p_id, p_game_id, p_rally_number, p_server_id, p_serve_side, p_serve_number,
    p_winner_id, p_end_reason, p_error_detail, p_forced, p_shot_type, p_shot_count
  );

  return p_id;
end;
$$;

-- API exposure per the hardening rules (0004): owner writes only — RLS gates
-- the actual rows either way, this just keeps /rpc tidy for anon.
revoke execute on function public.insert_rally_at(uuid, uuid, smallint, uuid, public.serve_side, smallint, uuid, public.end_reason, public.error_detail, boolean, public.shot_type, smallint) from public, anon;
grant execute on function public.insert_rally_at(uuid, uuid, smallint, uuid, public.serve_side, smallint, uuid, public.end_reason, public.error_detail, boolean, public.shot_type, smallint) to authenticated;
