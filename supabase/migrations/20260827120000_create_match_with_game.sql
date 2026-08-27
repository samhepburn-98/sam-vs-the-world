-- Create a match and its first game in one transaction (§1.8).
--
-- These were two separate client writes, ordered by the logger's write queue
-- so the game couldn't reach the API before its match. That worked, but it
-- made a one-off form submit depend on the queue's failure choreography: an
-- abandoned match left its game queued to FK-fail, which jammed the queue and
-- soured the next submit. Starting a match isn't rally logging — it's one
-- form, and it belongs in one call.
--
-- A plpgsql body runs inside the caller's transaction, so the pair can't
-- half-land: no game without its match, and no match sitting there without a
-- game 1 to log into.
--
-- SECURITY INVOKER (the default): runs as the calling role, so RLS decides
-- who can write — same as any direct insert.

create or replace function public.create_match_with_game(
  p_player1_id       uuid,
  p_player2_id       uuid,
  p_date             date,
  p_venue            text default null,
  p_format           smallint default null,
  p_target_score     smallint default 11,
  p_tiebreak         public.tiebreak default 'win_by_2',
  p_serves_per_point smallint default 2,
  p_let_resets_serve boolean default false,
  p_ball_type        public.ball_type default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare v_match_id uuid;
begin
  insert into public.matches (
    player1_id, player2_id, date, venue, format, target_score,
    tiebreak, serves_per_point, let_resets_serve, ball_type
  ) values (
    p_player1_id, p_player2_id, p_date, p_venue, p_format, p_target_score,
    p_tiebreak, p_serves_per_point, p_let_resets_serve, p_ball_type
  )
  returning id into v_match_id;

  insert into public.games (match_id, game_number) values (v_match_id, 1);

  return v_match_id;
end;
$$;

-- API exposure per the hardening rules (0004): owner writes only — RLS gates
-- the actual rows either way, this just keeps /rpc tidy for anon.
revoke execute on function public.create_match_with_game(uuid, uuid, date, text, smallint, smallint, public.tiebreak, smallint, boolean, public.ball_type) from public, anon;
grant execute on function public.create_match_with_game(uuid, uuid, date, text, smallint, smallint, public.tiebreak, smallint, boolean, public.ball_type) to authenticated;
