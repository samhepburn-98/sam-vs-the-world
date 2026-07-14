-- double_bounce finishes retiring. The logger stopped offering it long ago
-- (a ball the opponent never reached is a winner; one they reached too late
-- is the textbook not_up), but the retirement was client-side only: the
-- value stayed insertable, and error_profile still counted it into a column
-- the client schema never read — so any legacy row was counted in
-- errors_total yet invisible in every breakdown, and the "by type" and
-- "by cause" bars summed to different totals.
--
-- Same treatment as ace (20260710160000): fold legacy rows into the value
-- that means the same thing, retire the member with a CHECK (Postgres can't
-- drop enum values), and redefine error_profile without the dead column.

update public.rallies set error_detail = 'not_up'
  where error_detail = 'double_bounce';

alter table public.rallies add constraint rallies_error_detail_current
  check (error_detail is null or error_detail <> 'double_bounce');

-- RETURNS TABLE columns can't change under create or replace, so the
-- function goes and comes back — grants don't survive the drop, hence the
-- re-grant at the end.
drop function public.error_profile(uuid, uuid, public.ball_type, date, date);

create function public.error_profile(
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

grant execute on function public.error_profile(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
