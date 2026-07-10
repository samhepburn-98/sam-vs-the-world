-- Two model simplifications, one honest field each.
--
-- 1. Ace becomes derived, not stored. An ace IS a winner where the server
--    won on shot 1 — storing it as a separate end reason duplicated what
--    winner_id + shot_count already say, and cost a logging button. Existing
--    ace rows become winner rows with shot_count pinned to 1 (the defining
--    property), and a CHECK retires the value from new rows (the enum keeps
--    it — Postgres can't drop enum values).
update public.rallies set end_reason = 'winner', shot_count = 1
  where end_reason = 'ace';

-- (if exists: this check never made it to prod)
alter table public.rallies drop constraint if exists rallies_ace_winner_serves;
alter table public.rallies add constraint rallies_end_reason_current
  check (end_reason <> 'ace');

-- 2. shot_type becomes "the last shot of the rally" — the winning shot on a
--    winner, the failed attempt on an error (any error: with error_detail it
--    reads "tried a drop, went not-up"). One physical shot, one meaning, no
--    forced-error branch. Strokes, lets, and serve faults have no last shot
--    worth tagging.
alter table public.rallies drop constraint rallies_shot_type_scope;
alter table public.rallies add constraint rallies_shot_type_scope
  check (shot_type is null or end_reason in ('winner', 'error'));

-- serve_stats: aces are now derived — the server won a 1-shot winner rally.
create or replace function public.serve_stats(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  rallies_served          integer,
  serve_wins              integer,
  rallies_returned        integer,
  return_wins             integer,
  aces                    integer,
  double_faults           integer,
  two_serve_rallies_served integer,
  first_serve_faults      integer,
  serve1_served           integer,
  serve1_wins             integer,
  serve2_served           integer,
  serve2_wins             integer,
  left_served             integer,
  left_wins               integer,
  right_served            integer,
  right_wins              integer
)
language sql stable
set search_path = ''
as $$
  select
    (count(*) filter (where fr.server_id = p_player_id))::integer,
    (count(*) filter (where fr.server_id = p_player_id and fr.winner_id = p_player_id))::integer,
    (count(*) filter (where fr.server_id <> p_player_id))::integer,
    (count(*) filter (where fr.server_id <> p_player_id and fr.winner_id = p_player_id))::integer,
    (count(*) filter (where fr.server_id = p_player_id and fr.winner_id = p_player_id and fr.end_reason = 'winner' and fr.shot_count = 1))::integer,
    (count(*) filter (where fr.server_id = p_player_id and fr.end_reason = 'serve_fault'))::integer,
    (count(*) filter (where fr.server_id = p_player_id and m.serves_per_point = 2))::integer,
    (count(*) filter (where fr.server_id = p_player_id and m.serves_per_point = 2 and fr.serve_number = 2))::integer,
    (count(*) filter (where fr.server_id = p_player_id and m.serves_per_point = 2 and fr.serve_number = 1))::integer,
    (count(*) filter (where fr.server_id = p_player_id and m.serves_per_point = 2 and fr.serve_number = 1 and fr.winner_id = p_player_id))::integer,
    (count(*) filter (where fr.server_id = p_player_id and m.serves_per_point = 2 and fr.serve_number = 2))::integer,
    (count(*) filter (where fr.server_id = p_player_id and m.serves_per_point = 2 and fr.serve_number = 2 and fr.winner_id = p_player_id))::integer,
    (count(*) filter (where fr.server_id = p_player_id and fr.serve_side = 'left'))::integer,
    (count(*) filter (where fr.server_id = p_player_id and fr.serve_side = 'left' and fr.winner_id = p_player_id))::integer,
    (count(*) filter (where fr.server_id = p_player_id and fr.serve_side = 'right'))::integer,
    (count(*) filter (where fr.server_id = p_player_id and fr.serve_side = 'right' and fr.winner_id = p_player_id))::integer
  from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
  join public.matches m on m.id = fr.match_id
  where fr.winner_id is not null
$$;
