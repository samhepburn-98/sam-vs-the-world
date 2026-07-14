-- match_results never exposed when a match was logged — and date is a DATE,
-- so same-evening matches tie and any "newest first" read over the view picks
-- its rows nondeterministically. Append created_at (create or replace can
-- only add columns at the end, which is exactly what we do) so readers get a
-- total order; the derivation itself is unchanged.
create or replace view public.match_results with (security_invoker = true) as
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
  end as match_winner_id,
  m.created_at
from public.matches m
left join game_wins gw on gw.match_id = m.id
group by m.id, m.player1_id, m.player2_id, m.format, m.date, m.venue, m.ball_type, m.target_score, m.created_at;
