-- Migration 0004c (§8.4): rally_lengths + momentum, with their drill-through
-- companions. Both build on the 0004a filter helpers so the rally table
-- under a number can never drift from the number above it.
--
-- Pinned definitions (§3.3.4, §3.3.5):
--   · rally length operates over DECIDED rallies with shot_count >= 1 — a
--     null shot_count is untagged and a 0 is a double fault (no rally was
--     played), so both are excluded. The three buckets (1–3 / 4–8 / 9+)
--     then partition the average's denominator exactly.
--   · comeback = trailed by >= p_deficit (default 4) at any rally of a game
--     AND won that game. Fires AT the threshold, not below.
--   · streak = longest run of consecutive rally wins within a game, lets
--     excluded (gaps-and-islands over the decided rallies).
--   · phase band = by the leading score after a decided rally; boundaries
--     scale off target_score as round(4·target/11) and round(8·target/11),
--     which is the spec's 4 / 8 at target 11 and open-ended above (win-by-2
--     overtime lands in `close`).
--
-- Everything returns counts, never a bare rate (§3.5). SECURITY INVOKER,
-- read-only, public execute — same as 0004a/b.

-- ---------------------------------------------------------------------------
-- rally_lengths (§3.3.4): average + longest + the three histogram buckets,
-- each with its win count.
-- ---------------------------------------------------------------------------

create or replace function public.rally_lengths(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  total_rallies   integer,
  avg_length      numeric,
  longest         integer,
  short_rallies   integer,
  short_wins      integer,
  medium_rallies  integer,
  medium_wins     integer,
  long_rallies    integer,
  long_wins       integer
)
language sql stable
set search_path = ''
as $$
  with r as (
    select fr.shot_count, (fr.winner_id = p_player_id) as is_win
    from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
    where fr.winner_id is not null and fr.shot_count >= 1
  )
  select
    count(*)::integer,
    round(avg(shot_count), 2),
    coalesce(max(shot_count), 0)::integer,
    (count(*) filter (where shot_count between 1 and 3))::integer,
    (count(*) filter (where shot_count between 1 and 3 and is_win))::integer,
    (count(*) filter (where shot_count between 4 and 8))::integer,
    (count(*) filter (where shot_count between 4 and 8 and is_win))::integer,
    (count(*) filter (where shot_count >= 9))::integer,
    (count(*) filter (where shot_count >= 9 and is_win))::integer
  from r
$$;

-- The drill-through companion: the rallies in one length bucket (null = all
-- counted rallies) — via the same helper and predicate.
create or replace function public.rally_length_rallies(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null,
  p_bucket      text default null
)
returns setof public.rallies_scored
language sql stable
set search_path = ''
as $$
  select fr.*
  from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
  where fr.winner_id is not null and fr.shot_count >= 1
    and (p_bucket is null
      or (p_bucket = 'short'  and fr.shot_count between 1 and 3)
      or (p_bucket = 'medium' and fr.shot_count between 4 and 8)
      or (p_bucket = 'long'   and fr.shot_count >= 9))
  order by fr.date, fr.match_id, fr.game_number, fr.rally_number
$$;

-- ---------------------------------------------------------------------------
-- momentum (§3.3.5): comeback count, longest within-game win streak, phase
-- win-share bands, and the comeback list for the L2 page.
-- ---------------------------------------------------------------------------

create or replace function public.momentum(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null,
  p_deficit     integer default 4
)
returns table (
  comebacks              integer,
  longest_streak         integer,
  longest_streak_game_id uuid,
  early_rallies          integer,
  early_wins             integer,
  mid_rallies            integer,
  mid_wins               integer,
  close_rallies          integer,
  close_wins             integer,
  comeback_games         jsonb
)
language sql stable
set search_path = ''
as $$
  with r as (
    select
      fr.game_id, fr.match_id, fr.date, fr.rally_number, fr.winner_id,
      case when fr.player1_id = p_player_id then fr.score_p1 else fr.score_p2 end as p_score,
      case when fr.player1_id = p_player_id then fr.score_p2 else fr.score_p1 end as o_score,
      m.target_score,
      g.created_at as game_created_at
    from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
    join public.matches m on m.id = fr.match_id
    join public.games   g on g.id = fr.game_id
  ),
  -- decided rallies tagged with their phase band (leading score after them)
  bands as (
    select
      (winner_id = p_player_id) as is_win,
      case
        when greatest(p_score, o_score) <= round(4.0 * target_score / 11) then 'early'
        when greatest(p_score, o_score) <= round(8.0 * target_score / 11) then 'mid'
        else 'close'
      end as band
    from r
    where winner_id is not null
  ),
  -- per game: worst deficit faced and the final score (last rally's carry)
  game_defs as (
    select
      game_id, match_id, date,
      min(game_created_at)              as game_created_at,
      max(o_score - p_score)            as max_deficit,
      (array_agg(p_score order by rally_number desc))[1] as final_p,
      (array_agg(o_score order by rally_number desc))[1] as final_o
    from r
    group by game_id, match_id, date
  ),
  comeback_set as (
    select *
    from game_defs
    where max_deficit >= p_deficit
      and final_p > final_o            -- won the game (led at the last rally)
  ),
  -- longest consecutive win run within a game, lets excluded
  decided as (
    select game_id, rally_number, (winner_id = p_player_id) as is_win
    from r where winner_id is not null
  ),
  seq as (
    select
      game_id, is_win,
      row_number() over (partition by game_id order by rally_number)
      - row_number() over (partition by game_id, is_win order by rally_number) as grp
    from decided
  ),
  runs as (
    select game_id, count(*) as len
    from seq where is_win group by game_id, grp
  ),
  longest as (
    select game_id, len from runs order by len desc, game_id limit 1
  )
  select
    (select count(*) from comeback_set)::integer,
    coalesce((select len from longest), 0)::integer,
    (select game_id from longest),
    (select count(*) from bands where band = 'early')::integer,
    (select count(*) from bands where band = 'early' and is_win)::integer,
    (select count(*) from bands where band = 'mid')::integer,
    (select count(*) from bands where band = 'mid' and is_win)::integer,
    (select count(*) from bands where band = 'close')::integer,
    (select count(*) from bands where band = 'close' and is_win)::integer,
    (select coalesce(
       jsonb_agg(
         jsonb_build_object(
           'game_id',        cs.game_id,
           'match_id',       cs.match_id,
           'date',           cs.date,
           'max_deficit',    cs.max_deficit,
           'player_score',   cs.final_p,
           'opponent_score', cs.final_o
         )
         order by cs.date asc, cs.game_created_at asc
       ),
       '[]'::jsonb
     ) from comeback_set cs)
$$;

-- The drill-through companion: every rally of the player's comeback games,
-- so the L2 list can draw each game's momentum chart. Same comeback logic as
-- the aggregate, then all rallies of those games.
create or replace function public.comeback_rallies(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null,
  p_deficit     integer default 4
)
returns setof public.rallies_scored
language sql stable
set search_path = ''
as $$
  with r as (
    select
      fr.game_id, fr.rally_number,
      case when fr.player1_id = p_player_id then fr.score_p1 else fr.score_p2 end as p_score,
      case when fr.player1_id = p_player_id then fr.score_p2 else fr.score_p1 end as o_score
    from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
  ),
  comeback_games as (
    select game_id
    from r
    group by game_id
    having max(o_score - p_score) >= p_deficit
       and (array_agg(p_score order by rally_number desc))[1]
         > (array_agg(o_score order by rally_number desc))[1]
  )
  select fr.*
  from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
  where fr.game_id in (select game_id from comeback_games)
  order by fr.date, fr.match_id, fr.game_number, fr.rally_number
$$;

-- ---------------------------------------------------------------------------
-- API exposure: read-only public insight endpoints, same reach as the views.
-- ---------------------------------------------------------------------------

grant execute on function public.rally_lengths(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.rally_length_rallies(uuid, uuid, public.ball_type, date, date, text) to anon, authenticated;
grant execute on function public.momentum(uuid, uuid, public.ball_type, date, date, integer) to anon, authenticated;
grant execute on function public.comeback_rallies(uuid, uuid, public.ball_type, date, date, integer) to anon, authenticated;
