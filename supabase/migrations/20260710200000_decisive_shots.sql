-- One shot column per meaning, replacing the context-dependent shot_type.
--
-- "The last shot of the rally" made the tag depend on end_reason to know
-- whose racket it came off — a polymorphic column every consumer would have
-- to decode (and mis-group by). Split it:
--
--   winning_shot — the winner's decisive shot: their clean winner, or the
--                  shot that forced the error. Allowed on winner and forced
--                  errors.
--   losing_shot  — the loser's final failed shot: the botch on an unforced
--                  error, the flail on a forced one. Allowed on errors.
--
-- Existing data splits losslessly: the last shot on a winner rally was the
-- winner's shot; on an error rally it was the loser's attempt.

alter table public.rallies add column winning_shot public.shot_type;
alter table public.rallies add column losing_shot public.shot_type;

update public.rallies set winning_shot = shot_type
  where shot_type is not null and end_reason = 'winner';
update public.rallies set losing_shot = shot_type
  where shot_type is not null and end_reason = 'error';

alter table public.rallies add constraint rallies_winning_shot_scope
  check (
    winning_shot is null
    or end_reason = 'winner'
    or (end_reason = 'error' and forced is true)
  );
alter table public.rallies add constraint rallies_losing_shot_scope
  check (losing_shot is null or end_reason = 'error');

-- the retired enum values (kill/nick/volley/lob/other) stay locked out
alter table public.rallies add constraint rallies_winning_shot_current
  check (winning_shot is null or winning_shot in ('drop', 'drive', 'boast'));
alter table public.rallies add constraint rallies_losing_shot_current
  check (losing_shot is null or losing_shot in ('drop', 'drive', 'boast'));

alter table public.rallies drop constraint rallies_shot_type_scope;
alter table public.rallies drop constraint rallies_shot_type_current;

-- The old column threads through the drill-through stack: rallies_scored
-- carries it, game_results/match_results build on that view, and the six
-- drill-through functions return the view's rowtype. Changing a view's
-- columns needs drop-and-recreate, and the cascade takes the dependents —
-- all of which are column-agnostic (select *) and recreate verbatim.
-- insert_rally_at names the column explicitly, so it gets a new signature.
drop view public.rallies_scored cascade;
drop function public.insert_rally_at(
  uuid, uuid, smallint, uuid, public.serve_side, smallint, uuid,
  public.end_reason, public.error_detail, boolean, public.shot_type, smallint
);

alter table public.rallies drop column shot_type;

create view public.rallies_scored with (security_invoker = true) as
select
  r.id, r.game_id, g.match_id, g.game_number, r.rally_number,
  m.player1_id, m.player2_id, m.date, m.ball_type,
  r.server_id,
  case when r.server_id = m.player1_id then m.player2_id
       when r.server_id = m.player2_id then m.player1_id end as receiver_id,
  r.winner_id, r.end_reason, r.error_detail, r.forced,
  r.winning_shot, r.losing_shot,
  r.serve_side, r.serve_number, r.shot_count,
  (r.end_reason = 'let') as is_let,
  sum(case when r.winner_id = m.player1_id then 1 else 0 end)
      over (partition by r.game_id order by r.rally_number
            rows between unbounded preceding and current row) as score_p1,
  sum(case when r.winner_id = m.player2_id then 1 else 0 end)
      over (partition by r.game_id order by r.rally_number
            rows between unbounded preceding and current row) as score_p2
from public.rallies r
join public.games   g on g.id = r.game_id
join public.matches m on m.id = g.match_id;

create view public.game_results with (security_invoker = true) as
select distinct on (rs.game_id)
  rs.game_id, rs.match_id, rs.game_number, rs.player1_id, rs.player2_id,
  rs.date, rs.ball_type, rs.score_p1, rs.score_p2,
  case when rs.score_p1 > rs.score_p2 then rs.player1_id
       when rs.score_p2 > rs.score_p1 then rs.player2_id end as winner_id,
  (rs.score_p1 = rs.score_p2) as is_undecided
from public.rallies_scored rs
order by rs.game_id, rs.rally_number desc;

create view public.match_results with (security_invoker = true) as
with game_wins as (
  select gr.match_id, gr.winner_id
  from public.game_results gr
  where gr.winner_id is not null
)
select
  m.id as match_id, m.player1_id, m.player2_id, m.format,
  m.date, m.venue, m.ball_type, m.target_score,
  count(*) filter (where gw.winner_id = m.player1_id) as games_won_p1,
  count(*) filter (where gw.winner_id = m.player2_id) as games_won_p2,
  case
    when m.format is not null then
      case
        when count(*) filter (where gw.winner_id = m.player1_id) >= (m.format / 2 + 1) then m.player1_id
        when count(*) filter (where gw.winner_id = m.player2_id) >= (m.format / 2 + 1) then m.player2_id
      end
    else
      case
        when count(*) filter (where gw.winner_id = m.player1_id)
           > count(*) filter (where gw.winner_id = m.player2_id) then m.player1_id
        when count(*) filter (where gw.winner_id = m.player2_id)
           > count(*) filter (where gw.winner_id = m.player1_id) then m.player2_id
      end
  end as match_winner_id
from public.matches m
left join game_wins gw on gw.match_id = m.id
group by m.id, m.player1_id, m.player2_id, m.format, m.date, m.venue, m.ball_type, m.target_score;

create or replace function public.filtered_rallies(
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
  select rs.*
  from public.rallies_scored rs
  where (rs.player1_id = p_player_id or rs.player2_id = p_player_id)
    and (p_opponent_id is null
         or (case when rs.player1_id = p_player_id then rs.player2_id else rs.player1_id end) = p_opponent_id)
    and (p_ball_type is null or rs.ball_type = p_ball_type)
    and (p_date_from is null or rs.date >= p_date_from)
    and (p_date_to   is null or rs.date <= p_date_to)
$$;

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

create or replace function public.h2h_rallies(
  p_player1_id uuid,
  p_player2_id uuid,
  p_ball_type  public.ball_type default null,
  p_date_from  date default null,
  p_date_to    date default null
)
returns setof public.rallies_scored
language sql stable
set search_path = ''
as $$
  select fr.*
  from public.filtered_rallies(p_player1_id, p_player2_id, p_ball_type, p_date_from, p_date_to) fr
  order by fr.date, fr.match_id, fr.game_number, fr.rally_number
$$;

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

create or replace function public.insert_rally_at(
  p_id           uuid,
  p_game_id      uuid,
  p_rally_number smallint,
  p_server_id    uuid,
  p_serve_side   public.serve_side,
  p_serve_number smallint,
  p_winner_id    uuid,
  p_end_reason   public.end_reason,
  p_error_detail public.error_detail default null,
  p_forced       boolean default null,
  p_winning_shot public.shot_type default null,
  p_losing_shot  public.shot_type default null,
  p_shot_count   smallint default null
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
    winner_id, end_reason, error_detail, forced, winning_shot, losing_shot,
    shot_count
  ) values (
    p_id, p_game_id, p_rally_number, p_server_id, p_serve_side, p_serve_number,
    p_winner_id, p_end_reason, p_error_detail, p_forced, p_winning_shot,
    p_losing_shot, p_shot_count
  );

  return p_id;
end;
$$;

-- writes stay owner-path only, matching the hardening posture
revoke execute on function public.insert_rally_at(
  uuid, uuid, smallint, uuid, public.serve_side, smallint, uuid,
  public.end_reason, public.error_detail, boolean, public.shot_type,
  public.shot_type, smallint
) from public, anon;
grant execute on function public.insert_rally_at(
  uuid, uuid, smallint, uuid, public.serve_side, smallint, uuid,
  public.end_reason, public.error_detail, boolean, public.shot_type,
  public.shot_type, smallint
) to authenticated, service_role;
