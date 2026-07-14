-- Draws become first-class. match_results now states the verdict itself —
-- 'p1' | 'p2' | 'draw' | 'pending' — instead of leaving a null winner for
-- every reader to interpret its own way (the profile called it in play, the
-- compare panel called it drawn, the lists said nothing). The rule extends
-- the doctrine the view already applies to winners: a casual session belongs
-- to whoever leads it, so one that stands level after at least one decided
-- game IS a draw — until the next game tips it, exactly as a lead is a win
-- until it's answered. An unclinched best-of and a session with nothing
-- decided yet stay 'pending'.
--
-- outcome is appended as the last column (create or replace can only add at
-- the end); match_winner_id keeps its meaning and its readers.

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
  m.created_at,
  case
    when m.format is not null then
      case
        when count(*) filter (where gw.winner_id = m.player1_id) >= (m.format / 2 + 1) then 'p1'
        when count(*) filter (where gw.winner_id = m.player2_id) >= (m.format / 2 + 1) then 'p2'
        else 'pending'
      end
    else
      case
        when count(*) filter (where gw.winner_id = m.player1_id)
           > count(*) filter (where gw.winner_id = m.player2_id) then 'p1'
        when count(*) filter (where gw.winner_id = m.player2_id)
           > count(*) filter (where gw.winner_id = m.player1_id) then 'p2'
        when count(*) filter (where gw.winner_id is not null) > 0 then 'draw'
        else 'pending'
      end
  end as outcome
from public.matches m
left join game_wins gw on gw.match_id = m.id
group by m.id, m.player1_id, m.player2_id, m.format, m.date, m.venue, m.ball_type, m.target_score, m.created_at;

