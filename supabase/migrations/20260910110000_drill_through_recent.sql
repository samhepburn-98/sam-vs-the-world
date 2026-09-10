-- The drill-through p_limit, corrected.
--
-- 20260910100000 added `p_limit` to the four `*_rallies` companions, but
-- applied it under the display ordering, which runs oldest-first. A limit
-- therefore took the OLDEST n rallies: the table under a stat would have
-- shown the first points ever logged, and would have stopped changing as
-- more were played. That is the wrong end of the list for a drill-through,
-- whose job is to show the rallies behind the number as it stands now.
--
-- The three rally-shaped companions below select the most recent n in an
-- inner query, then restore the chronological ordering on the way out.
-- comeback_rallies counts games instead, for the reason given above it.
-- With p_limit null every result is byte-identical to before — same rows,
-- same order — so the only behaviour that changes is the one nothing was
-- using yet.

drop function public.serve_rallies(uuid, uuid, public.ball_type, date, date, integer);
create function public.serve_rallies(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null,
  p_limit       integer default null
)
returns setof public.rallies_scored
language sql stable
set search_path = ''
as $$
  select * from (
    select fr.*
    from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
    where fr.winner_id is not null
      and fr.server_id = p_player_id
    order by fr.date desc, fr.match_id desc, fr.game_number desc, fr.rally_number desc
    limit p_limit
  ) t
  order by t.date, t.match_id, t.game_number, t.rally_number
$$;

drop function public.error_rallies(uuid, uuid, public.ball_type, date, date, integer);
create function public.error_rallies(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null,
  p_limit       integer default null
)
returns setof public.rallies_scored
language sql stable
set search_path = ''
as $$
  select * from (
    select fr.*
    from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
    where fr.winner_id is not null
      and fr.winner_id <> p_player_id
      and fr.end_reason in ('error', 'serve_fault')
    order by fr.date desc, fr.match_id desc, fr.game_number desc, fr.rally_number desc
    limit p_limit
  ) t
  order by t.date, t.match_id, t.game_number, t.rally_number
$$;

drop function public.rally_length_rallies(uuid, uuid, public.ball_type, date, date, text, integer);
create function public.rally_length_rallies(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null,
  p_bucket      text default null,
  p_limit       integer default null
)
returns setof public.rallies_scored
language sql stable
set search_path = ''
as $$
  select * from (
    select fr.*
    from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
    where fr.winner_id is not null and fr.shot_count >= 1
      and (p_bucket is null
        or (p_bucket = 'short'  and fr.shot_count between 1 and 3)
        or (p_bucket = 'medium' and fr.shot_count between 4 and 8)
        or (p_bucket = 'long'   and fr.shot_count >= 9))
    order by fr.date desc, fr.match_id desc, fr.game_number desc, fr.rally_number desc
    limit p_limit
  ) t
  order by t.date, t.match_id, t.game_number, t.rally_number
$$;

-- comeback_rallies is the odd one out: the momentum page groups its rows
-- into one chart per game, so cutting at a rally boundary would draw half a
-- comeback. Its p_limit counts GAMES, and every rally of those games comes
-- back whole. Folding filtered_rallies into a CTE also drops this function
-- from two evaluations of it to one.
drop function public.comeback_rallies(uuid, uuid, public.ball_type, date, date, integer, integer);
create function public.comeback_rallies(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null,
  p_deficit     integer default 4,
  p_limit       integer default null
)
returns setof public.rallies_scored
language sql stable
set search_path = ''
as $$
  with fr as (
    select *
    from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to)
  ),
  r as (
    select
      game_id, rally_number,
      case when player1_id = p_player_id then score_p1 else score_p2 end as p_score,
      case when player1_id = p_player_id then score_p2 else score_p1 end as o_score
    from fr
  ),
  comeback_games as (
    select game_id
    from r
    group by game_id
    having max(o_score - p_score) >= p_deficit
       and (array_agg(p_score order by rally_number desc))[1]
         > (array_agg(o_score order by rally_number desc))[1]
  ),
  recent_games as (
    select fr.game_id
    from fr
    where fr.game_id in (select game_id from comeback_games)
    group by fr.game_id
    order by max(fr.date) desc, max(fr.game_number) desc
    limit p_limit
  )
  select fr.*
  from fr
  where fr.game_id in (select game_id from recent_games)
  order by fr.date, fr.match_id, fr.game_number, fr.rally_number
$$;

grant execute on function public.serve_rallies(
  uuid, uuid, public.ball_type, date, date, integer) to anon, authenticated;
grant execute on function public.error_rallies(
  uuid, uuid, public.ball_type, date, date, integer) to anon, authenticated;
grant execute on function public.rally_length_rallies(
  uuid, uuid, public.ball_type, date, date, text, integer) to anon, authenticated;
grant execute on function public.comeback_rallies(
  uuid, uuid, public.ball_type, date, date, integer, integer) to anon, authenticated;
