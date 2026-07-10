-- Aces stop being an explicit end reason and become derived. A rally's first
-- (and, at shot_count = 1, only) shot is always the serve, so a winner on a
-- single shot is necessarily the server winning on the serve — an ace. This
-- removes the redundancy between "ace" and a 1-shot "winner" and the ambiguity
-- it caused when logging. The 'ace' enum value is kept (dropping it would mean
-- recreating the type and every dependent object) but is no longer produced.

-- 1. reclassify existing aces as 1-shot winners (a single-shot rally IS the serve)
update public.rallies
set end_reason = 'winner', shot_count = 1
where end_reason = 'ace';

-- 2. the ace-only integrity guard no longer applies
alter table public.rallies drop constraint if exists rallies_ace_winner_serves;

-- 3. shot_type now scopes to winners only (aces folded in)
alter table public.rallies drop constraint if exists rallies_shot_type_scope;
alter table public.rallies add constraint rallies_shot_type_scope
  check (shot_type is null or end_reason = 'winner');

-- 4. serve_stats: aces derived as a winning serve — a winner with one shot
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
    (count(*) filter (where fr.server_id = p_player_id and fr.end_reason = 'winner' and fr.shot_count = 1))::integer,
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
