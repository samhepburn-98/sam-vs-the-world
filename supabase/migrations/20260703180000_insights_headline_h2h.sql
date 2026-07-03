-- Migration 0004a (§8.4): the first insight RPCs — player_headline(s) and
-- h2h — plus the shared filter helpers every 0004 RPC builds on.
--
-- The aggregate/companion pattern: an aggregate RPC and its *_rallies
-- companion both read from the SAME set-returning helper, so the rally table
-- under a number can never drift from the number above it. The client never
-- re-implements a stat's filter.
--
-- All functions are SECURITY INVOKER (the default) and read only through the
-- security-invoker views, so RLS decides visibility exactly as it does for
-- direct selects. Execute is granted to anon + authenticated — public read,
-- matching the views (§2.5).

-- ---------------------------------------------------------------------------
-- Shared filter helpers: one player's perspective on the fundamentals, with
-- the cross-cutting filters (§3.6) applied — opponent, ball, date range.
-- ---------------------------------------------------------------------------

create or replace function public.filtered_matches(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  match_id       uuid,
  date           date,
  created_at     timestamptz,
  opponent_id    uuid,
  ball_type      public.ball_type,
  player_games   integer,
  opponent_games integer,
  winner_id      uuid,
  won            boolean  -- null while the match has no leader (drawn/ongoing)
)
language sql stable
set search_path = ''
as $$
  select
    mr.match_id,
    mr.date,
    m.created_at,
    case when mr.player1_id = p_player_id then mr.player2_id else mr.player1_id end,
    mr.ball_type,
    (case when mr.player1_id = p_player_id then mr.games_won_p1 else mr.games_won_p2 end)::integer,
    (case when mr.player1_id = p_player_id then mr.games_won_p2 else mr.games_won_p1 end)::integer,
    mr.match_winner_id,
    case when mr.match_winner_id is null then null
         else mr.match_winner_id = p_player_id end
  from public.match_results mr
  join public.matches m on m.id = mr.match_id
  where (mr.player1_id = p_player_id or mr.player2_id = p_player_id)
    and (p_opponent_id is null
         or (case when mr.player1_id = p_player_id then mr.player2_id else mr.player1_id end) = p_opponent_id)
    and (p_ball_type is null or mr.ball_type = p_ball_type)
    and (p_date_from is null or mr.date >= p_date_from)
    and (p_date_to   is null or mr.date <= p_date_to)
$$;

create or replace function public.filtered_games(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  match_id       uuid,
  game_id        uuid,
  game_number    smallint,
  date           date,
  created_at     timestamptz,
  opponent_id    uuid,
  ball_type      public.ball_type,
  player_score   integer,
  opponent_score integer,
  is_undecided   boolean,
  won            boolean  -- null when the game is undecided (tied at its last rally)
)
language sql stable
set search_path = ''
as $$
  select
    gr.match_id,
    gr.game_id,
    gr.game_number::smallint,
    gr.date,
    g.created_at,
    case when gr.player1_id = p_player_id then gr.player2_id else gr.player1_id end,
    gr.ball_type,
    (case when gr.player1_id = p_player_id then gr.score_p1 else gr.score_p2 end)::integer,
    (case when gr.player1_id = p_player_id then gr.score_p2 else gr.score_p1 end)::integer,
    gr.is_undecided,
    case when gr.is_undecided then null else gr.winner_id = p_player_id end
  from public.game_results gr
  join public.games g on g.id = gr.game_id
  where (gr.player1_id = p_player_id or gr.player2_id = p_player_id)
    and (p_opponent_id is null
         or (case when gr.player1_id = p_player_id then gr.player2_id else gr.player1_id end) = p_opponent_id)
    and (p_ball_type is null or gr.ball_type = p_ball_type)
    and (p_date_from is null or gr.date >= p_date_from)
    and (p_date_to   is null or gr.date <= p_date_to)
$$;

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

-- ---------------------------------------------------------------------------
-- player_headline (§3.2): win rate over DECIDED games with its denominators,
-- W–L records, recent game results (date + created_at, newest first), and
-- the signature trait. Always exactly one row.
--
-- Signature trait: grinder if win rate on long rallies (9+ shots) beats the
-- short-rally (1–3) win rate by ≥10 points; shotmaker if the reverse;
-- balanced otherwise — and null unless BOTH buckets hold ≥30 decided rallies
-- with a known shot_count. Lets never count (no winner).
-- ---------------------------------------------------------------------------

create or replace function public.player_headline(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  player_id       uuid,
  games_won       integer,
  games_decided   integer,
  matches_won     integer,
  matches_decided integer,
  signature_trait text,
  recent_games    jsonb
)
language sql stable
set search_path = ''
as $$
  select
    p_player_id,
    g.games_won,
    g.games_decided,
    m.matches_won,
    m.matches_decided,
    t.signature_trait,
    r.recent_games
  from
    (
      select
        (count(*) filter (where fg.won))::integer            as games_won,
        (count(*) filter (where fg.won is not null))::integer as games_decided
      from public.filtered_games(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fg
    ) g
  cross join
    (
      select
        (count(*) filter (where fm.won))::integer            as matches_won,
        (count(*) filter (where fm.won is not null))::integer as matches_decided
      from public.filtered_matches(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fm
    ) m
  cross join
    (
      select case
        when count(*) filter (where fr.shot_count between 1 and 3) >= 30
         and count(*) filter (where fr.shot_count >= 9) >= 30
        then case
          when avg((fr.winner_id = p_player_id)::int) filter (where fr.shot_count >= 9)
             - avg((fr.winner_id = p_player_id)::int) filter (where fr.shot_count between 1 and 3)
             >= 0.10 then 'grinder'
          when avg((fr.winner_id = p_player_id)::int) filter (where fr.shot_count between 1 and 3)
             - avg((fr.winner_id = p_player_id)::int) filter (where fr.shot_count >= 9)
             >= 0.10 then 'shotmaker'
          else 'balanced'
        end
      end as signature_trait
      from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
      where fr.winner_id is not null and fr.shot_count is not null
    ) t
  cross join
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'game_id',        fg.game_id,
            'match_id',       fg.match_id,
            'game_number',    fg.game_number,
            'date',           fg.date,
            'opponent_id',    fg.opponent_id,
            'player_score',   fg.player_score,
            'opponent_score', fg.opponent_score,
            'won',            fg.won
          )
          order by fg.date desc, fg.created_at desc, fg.game_number desc
        ),
        '[]'::jsonb
      ) as recent_games
      from (
        select *
        from public.filtered_games(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to)
        order by date desc, created_at desc, game_number desc
        limit 10
      ) fg
    ) r
$$;

-- The batch variant for the home roster — every player's headline in one
-- call, no per-card N+1 (§8.4). Unfiltered by design: the roster shows the
-- all-time picture.
create or replace function public.players_headline()
returns table (
  player_id       uuid,
  name            text,
  handedness      public.handedness,
  games_won       integer,
  games_decided   integer,
  matches_won     integer,
  matches_decided integer,
  signature_trait text,
  recent_games    jsonb
)
language sql stable
set search_path = ''
as $$
  select
    p.id, p.name, p.handedness,
    h.games_won, h.games_decided, h.matches_won, h.matches_decided,
    h.signature_trait, h.recent_games
  from public.players p
  cross join lateral public.player_headline(p.id) h
  order by p.name
$$;

-- ---------------------------------------------------------------------------
-- h2h (§3.3.1): the record between two players, from p_player1's perspective
-- (_p1 columns belong to the first argument). match_history is date-ascending
-- for the win-rate-over-time line. Always exactly one row.
-- ---------------------------------------------------------------------------

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
              'winner_id',    fm.winner_id
            )
            order by fm.date asc, fm.created_at asc
          ),
          '[]'::jsonb
        ) as match_history
      from public.filtered_matches(p_player1_id, p_player2_id, p_ball_type, p_date_from, p_date_to) fm
    ) m
$$;

-- The drill-through companion: the rally rows behind the h2h numbers, via
-- the SAME helper the aggregate reads from.
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

-- ---------------------------------------------------------------------------
-- API exposure: read-only public insight endpoints, same reach as the views.
-- ---------------------------------------------------------------------------

grant execute on function public.filtered_matches(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.filtered_games(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.filtered_rallies(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.player_headline(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.players_headline() to anon, authenticated;
grant execute on function public.h2h(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
grant execute on function public.h2h_rallies(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
