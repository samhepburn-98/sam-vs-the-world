-- The records wall: one read-only RPC returning every all-time record as a
-- uniform row, so the whole wall is a single round trip. Each record is an
-- isolated block with the same contract — lift one into its own function the
-- day a second caller (e.g. per-match records) shows up, not before.
--
-- Pinned conventions:
--   · first achiever holds a record until it is STRICTLY beaten — every
--     block orders `value desc, date asc, created_at asc` (same-evening
--     matches tie on date; created_at is the log order) and then play
--     order within a match, so the tail is deterministic and first-wins.
--   · a record with no qualifying data returns no row (the client hides it).
--   · player_id is the holder; null means the record belongs to the match
--     (both players own a marathon). player1_id/player2_id always carry the
--     match pairing so the client can caption without a second fetch.
--   · aces use the derived definition (a 1-shot winner by the server),
--     exactly as serve_stats counts them.
--   · rally counts include lets — a marathon measures time on court.
--
-- SECURITY INVOKER, read-only, public execute — same as the insight RPCs.

create or replace function public.records()
returns table (
  record_key text,
  player_id  uuid,
  player1_id uuid,
  player2_id uuid,
  value      integer,
  detail     text,
  match_id   uuid,
  date       date
)
language sql stable
set search_path = ''
as $$
  -- biggest_win: the widest games margin in a decided match; the detail is
  -- the scoreline winner-first, the way a result is read out.
  (
    select 'biggest_win', mr.match_winner_id, mr.player1_id, mr.player2_id,
           abs(mr.games_won_p1 - mr.games_won_p2)::integer,
           greatest(mr.games_won_p1, mr.games_won_p2)::text
             || '–' || least(mr.games_won_p1, mr.games_won_p2)::text,
           mr.match_id, mr.date
    from public.match_results mr
    where mr.outcome in ('p1', 'p2')
    order by abs(mr.games_won_p1 - mr.games_won_p2) desc,
             mr.date asc, mr.created_at asc, mr.match_id
    limit 1
  )
  union all
  -- longest_rally: max shot_count over decided rallies. Same exclusions as
  -- rally_lengths — null is untagged, 0 is a double fault, lets have no
  -- winner — so the wall can never disagree with the profile stats.
  (
    select 'longest_rally', rs.winner_id, rs.player1_id, rs.player2_id,
           rs.shot_count::integer, null::text, rs.match_id, rs.date
    from public.rallies_scored rs
    join public.matches m on m.id = rs.match_id
    where rs.winner_id is not null and rs.shot_count >= 1
    order by rs.shot_count desc,
             rs.date asc, m.created_at asc, rs.match_id,
             rs.game_number asc, rs.rally_number asc
    limit 1
  )
  union all
  -- best_streak: longest run of consecutive match wins per player, over
  -- their decided-or-drawn matches in played order (gaps-and-islands). A
  -- draw breaks a run (it is not a win); a pending match is not yet played
  -- to a verdict, so it neither extends nor breaks one. The record's match
  -- is the run's last win — for equal lengths, its date IS when each
  -- player reached that length, so `date asc` is the first-achiever rule.
  (
    with played as (
      select mr.match_id, mr.date, mr.created_at, p.player_id,
             coalesce(mr.match_winner_id = p.player_id, false) as is_win
      from public.match_results mr
      cross join lateral (values (mr.player1_id), (mr.player2_id)) as p(player_id)
      where mr.outcome in ('p1', 'p2', 'draw')
    ),
    seq as (
      select played.*,
             row_number() over (partition by player_id
                                order by date, created_at, match_id)
             - row_number() over (partition by player_id, is_win
                                  order by date, created_at, match_id) as grp
      from played
    ),
    runs as (
      -- the run's END is its last win in the seq order (date, created_at,
      -- match_id) — not max(created_at), which a backfilled earlier match
      -- logged late would inflate, misattributing when the run finished
      select player_id, count(*) as len,
             (array_agg(match_id order by date desc, created_at desc, match_id desc))[1]
               as end_match_id,
             max(date) as end_date,
             (array_agg(created_at order by date desc, created_at desc, match_id desc))[1]
               as end_created_at
      from seq
      where is_win
      group by player_id, grp
    )
    select 'best_streak', r.player_id, mr.player1_id, mr.player2_id,
           r.len::integer, null::text, r.end_match_id, r.end_date
    from runs r
    join public.match_results mr on mr.match_id = r.end_match_id
    order by r.len desc, r.end_date asc, r.end_created_at asc, r.end_match_id
    limit 1
  )
  union all
  -- marathon_game: most rallies in a single game, lets included. The detail
  -- is the game's final score, player1-first to match the pairing caption.
  (
    with per_game as (
      select rs.game_id, rs.match_id, rs.player1_id, rs.player2_id,
             rs.date, rs.game_number, m.created_at as match_created_at,
             count(*) as n
      from public.rallies_scored rs
      join public.matches m on m.id = rs.match_id
      group by rs.game_id, rs.match_id, rs.player1_id, rs.player2_id,
               rs.date, rs.game_number, m.created_at
    )
    select 'marathon_game', null::uuid, pg.player1_id, pg.player2_id,
           pg.n::integer,
           gr.score_p1::text || '–' || gr.score_p2::text,
           pg.match_id, pg.date
    from per_game pg
    join public.game_results gr on gr.game_id = pg.game_id
    order by pg.n desc, pg.date asc, pg.match_created_at asc, pg.match_id,
             pg.game_number asc
    limit 1
  )
  union all
  -- most_aces: one player's aces in one match, using the derived definition
  -- (a 1-shot winner by the server) — the same predicate as serve_stats.
  (
    select 'most_aces', rs.winner_id, rs.player1_id, rs.player2_id,
           count(*)::integer, null::text, rs.match_id, rs.date
    from public.rallies_scored rs
    join public.matches m on m.id = rs.match_id
    where rs.server_id = rs.winner_id
      and rs.end_reason = 'winner' and rs.shot_count = 1
    group by rs.winner_id, rs.player1_id, rs.player2_id, rs.match_id, rs.date,
             m.created_at
    -- when both players of one match tie on aces, the first to COMPLETE the
    -- count holds it: the earlier final ace, in play order (game·rally)
    order by count(*) desc, rs.date asc, m.created_at asc, rs.match_id,
             max(rs.game_number::integer * 100000 + rs.rally_number) asc
    limit 1
  )
  union all
  -- most_lets: the most argumentative match. Match-owned — no holder.
  (
    select 'most_lets', null::uuid, rs.player1_id, rs.player2_id,
           count(*)::integer, null::text, rs.match_id, rs.date
    from public.rallies_scored rs
    join public.matches m on m.id = rs.match_id
    where rs.is_let
    group by rs.player1_id, rs.player2_id, rs.match_id, rs.date, m.created_at
    order by count(*) desc, rs.date asc, m.created_at asc, rs.match_id
    limit 1
  )
$$;

grant execute on function public.records() to anon, authenticated;
