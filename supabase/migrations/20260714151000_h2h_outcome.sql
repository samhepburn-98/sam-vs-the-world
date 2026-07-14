-- h2h's match_history passes match_results.outcome through, so the compare
-- panel reads the verdict instead of guessing what a null winner means.
-- Same signature — create or replace, grants survive. Split from the view
-- migration so the derivation test suite can load the view without h2h's
-- filtered_* dependencies.
create or replace function public.h2h(
  p_player1_id uuid,
  p_player2_id uuid,
  p_ball_type  public.ball_type default null,
  p_date_from  date default null,
  p_date_to    date default null
)
returns table (
  games_won_p1    integer,
  games_won_p2    integer,
  games_decided   integer,
  matches_won_p1  integer,
  matches_won_p2  integer,
  matches_decided integer,
  match_history   jsonb
)
language sql stable
set search_path = ''
as $$
  select
    g.games_won_p1,
    g.games_won_p2,
    g.games_decided,
    m.matches_won_p1,
    m.matches_won_p2,
    m.matches_decided,
    m.match_history
  from
    (
      select
        (count(*) filter (where fg.won))::integer             as games_won_p1,
        (count(*) filter (where fg.won = false))::integer     as games_won_p2,
        (count(*) filter (where fg.won is not null))::integer as games_decided
      from public.filtered_games(p_player1_id, p_player2_id, p_ball_type, p_date_from, p_date_to) fg
    ) g
  cross join
    (
      select
        (count(*) filter (where fm.won))::integer             as matches_won_p1,
        (count(*) filter (where fm.won = false))::integer     as matches_won_p2,
        (count(*) filter (where fm.won is not null))::integer as matches_decided,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'match_id',     fm.match_id,
              'date',         fm.date,
              'games_won_p1', fm.player_games,
              'games_won_p2', fm.opponent_games,
              'winner_id',    fm.winner_id,
              'outcome',      mr.outcome
            )
            order by fm.date asc, fm.created_at asc
          ),
          '[]'::jsonb
        ) as match_history
      from public.filtered_matches(p_player1_id, p_player2_id, p_ball_type, p_date_from, p_date_to) fm
      join public.match_results mr on mr.match_id = fm.match_id
    ) m
$$;
