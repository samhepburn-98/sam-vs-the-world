-- Migration 0004b (§8.4): serve_stats + error_profile, with their
-- drill-through companions. Both build on the 0004a filter helpers so the
-- rally table under a number can never drift from the number above it.
--
-- Pinned derivations (§3.3.2, §3.3.3):
--   · every serve denominator excludes lets — a let + its replay would
--     otherwise double-count one serve
--   · a first-serve fault is never a row: it exists implicitly as a point
--     played on serve 2
--   · serve-number stats are computed over serves_per_point = 2 matches
--     ONLY (§7.7) — first-serve-fault rate is meaningless in single-serve
--     squash; overall serve win % still counts every match
--   · error-maker = the non-winner on error/serve_fault rows
--   · the forced/unforced/untagged three-way covers end_reason = 'error'
--     rows only — `forced` cannot exist on a serve_fault (scope CHECK), so
--     folding those into "untagged" would inflate it with rows that can
--     never be tagged
--
-- Everything returns numerator + denominator pairs, never a bare rate
-- (§3.5). SECURITY INVOKER, read-only, public execute — same as 0004a.

-- ---------------------------------------------------------------------------
-- serve_stats: one row of §3.3.2, all counts.
-- ---------------------------------------------------------------------------

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
    (count(*) filter (where fr.server_id = p_player_id and fr.end_reason = 'ace'))::integer,
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

-- The drill-through companion: every decided rally the player served —
-- serve_stats' outermost denominator, via the same helper and predicate.
create or replace function public.serve_rallies(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
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
$$;

-- ---------------------------------------------------------------------------
-- error_profile: one row of §3.3.3. errors_total spans error + serve_fault
-- (the error-maker convention); the forced three-way spans 'error' only.
-- games_played is every game with rallies, decided or not — errors happen
-- in undecided games too. trend is one entry per match, date-ascending:
-- {match_id, date, errors, games}.
-- ---------------------------------------------------------------------------

create or replace function public.error_profile(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  errors_total     integer,
  forced_errors    integer,
  unforced_errors  integer,
  untagged_errors  integer,
  tin              integer,
  out_top          integer,
  out_side         integer,
  out_back         integer,
  not_up           integer,
  double_bounce    integer,
  detail_untagged  integer,
  games_played     integer,
  trend            jsonb
)
language sql stable
set search_path = ''
as $$
  with errors as (
    select fr.*
    from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
    where fr.winner_id is not null
      and fr.winner_id <> p_player_id
      and fr.end_reason in ('error', 'serve_fault')
  ),
  games as (
    select fg.match_id, fg.date, fg.created_at
    from public.filtered_games(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fg
  ),
  per_match as (
    select
      g.match_id,
      g.date,
      min(g.created_at) as created_at,
      count(*)::integer as games,
      (select count(*) from errors e where e.match_id = g.match_id)::integer as errors
    from games g
    group by g.match_id, g.date
  )
  select
    (select count(*) from errors)::integer,
    (select count(*) from errors where end_reason = 'error' and forced is true)::integer,
    (select count(*) from errors where end_reason = 'error' and forced is false)::integer,
    (select count(*) from errors where end_reason = 'error' and forced is null)::integer,
    (select count(*) from errors where error_detail = 'tin')::integer,
    (select count(*) from errors where error_detail = 'out_top')::integer,
    (select count(*) from errors where error_detail = 'out_side')::integer,
    (select count(*) from errors where error_detail = 'out_back')::integer,
    (select count(*) from errors where error_detail = 'not_up')::integer,
    (select count(*) from errors where error_detail = 'double_bounce')::integer,
    (select count(*) from errors where error_detail is null)::integer,
    (select count(*) from games)::integer,
    (select coalesce(
       jsonb_agg(
         jsonb_build_object(
           'match_id', pm.match_id,
           'date',     pm.date,
           'errors',   pm.errors,
           'games',    pm.games
         )
         order by pm.date asc, pm.created_at asc
       ),
       '[]'::jsonb
     ) from per_match pm)
$$;

-- The drill-through companion: the error rows behind every error_profile
-- count — same helper, same predicate as the `errors` CTE above.
create or replace function public.error_rallies(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
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
$$;

-- ---------------------------------------------------------------------------
-- API exposure: read-only public insight endpoints, same reach as the views.
-- ---------------------------------------------------------------------------

grant execute on function public.serve_stats(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.serve_rallies(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.error_profile(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.error_rallies(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
