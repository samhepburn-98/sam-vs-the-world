-- The profile's six insight payloads in one round trip, and a limit on the
-- four drill-through companions (audit §3, items 1 and 7).
--
-- WHAT THIS FIXES. A profile needed six calls; the home page needed six per
-- roster player on top of its own three, behind an awaited players read — 21
-- requests for three players, growing with the roster. Each carried the same
-- five arguments and returned one row.
--
-- WHAT IT DOES NOT FIX. The six still scan separately: every one calls
-- filtered_rallies() -> rallies_scored, so the window functions run six times
-- over the same rally set. Collapsing THAT means one query computing all six
-- aggregates from a single scan, which would duplicate the six functions'
-- logic and leave two definitions of every insight to keep in step. The
-- project's rule is one function per insight with its drill-through companion
-- reading the same helper, so the numbers can never disagree; trading that for
-- a scan is the wrong trade at this volume. This buys the round trips, which
-- is where the latency actually is, and leaves the scans for the day a
-- profile is slow enough to measure.

create or replace function public.player_insights(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  headline       jsonb,
  serve          jsonb,
  errors         jsonb,
  rally_lengths  jsonb,
  momentum       jsonb,
  decisive_shots jsonb
)
language sql stable
set search_path = ''
as $$
  -- anchored on a one-row dummy and joined laterally so a sub-function
  -- returning no rows yields a null column, never an empty result. Each
  -- returns exactly one row today; this makes that a property of the call
  -- site rather than an assumption about six other functions.
  select
    to_jsonb(h) as headline,
    to_jsonb(s) as serve,
    to_jsonb(e) as errors,
    to_jsonb(r) as rally_lengths,
    to_jsonb(m) as momentum,
    to_jsonb(d) as decisive_shots
  from (select 1) as anchor
  left join lateral public.player_headline(
    p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) h on true
  left join lateral public.serve_stats(
    p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) s on true
  left join lateral public.error_profile(
    p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) e on true
  left join lateral public.rally_lengths(
    p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) r on true
  left join lateral public.momentum(
    p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) m on true
  left join lateral public.decisive_shots(
    p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) d on true
$$;

grant execute on function public.player_insights(
  uuid, uuid, public.ball_type, date, date) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Drill-through limits (audit §3 item 7). These return full rally detail with
-- no ceiling, which is fine at 567 rallies and a payload problem later. The
-- parameter defaults to null = no limit, so every existing caller is
-- unchanged; the tables can adopt it when they grow paging.
--
-- Dropped and recreated rather than replaced: a new parameter makes a new
-- signature, so `create or replace` would leave the old function beside it and
-- a five-argument call would be ambiguous between them.

drop function public.serve_rallies(uuid, uuid, public.ball_type, date, date);
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
  select fr.*
  from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
  where fr.winner_id is not null
    and fr.server_id = p_player_id
  order by fr.date, fr.match_id, fr.game_number, fr.rally_number
  limit p_limit
$$;

drop function public.error_rallies(uuid, uuid, public.ball_type, date, date);
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
  select fr.*
  from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
  where fr.winner_id is not null
    and fr.winner_id <> p_player_id
    and fr.end_reason in ('error', 'serve_fault')
  order by fr.date, fr.match_id, fr.game_number, fr.rally_number
  limit p_limit
$$;

drop function public.rally_length_rallies(uuid, uuid, public.ball_type, date, date, text);
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
  select fr.*
  from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
  where fr.winner_id is not null and fr.shot_count >= 1
    and (p_bucket is null
      or (p_bucket = 'short'  and fr.shot_count between 1 and 3)
      or (p_bucket = 'medium' and fr.shot_count between 4 and 8)
      or (p_bucket = 'long'   and fr.shot_count >= 9))
  order by fr.date, fr.match_id, fr.game_number, fr.rally_number
  limit p_limit
$$;

drop function public.comeback_rallies(uuid, uuid, public.ball_type, date, date, integer);
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
  limit p_limit
$$;

grant execute on function public.serve_rallies(
  uuid, uuid, public.ball_type, date, date, integer) to anon, authenticated;
grant execute on function public.error_rallies(
  uuid, uuid, public.ball_type, date, date, integer) to anon, authenticated;
grant execute on function public.rally_length_rallies(
  uuid, uuid, public.ball_type, date, date, text, integer) to anon, authenticated;
grant execute on function public.comeback_rallies(
  uuid, uuid, public.ball_type, date, date, integer, integer) to anon, authenticated;
