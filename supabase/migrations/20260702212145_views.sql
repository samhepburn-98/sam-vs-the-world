create view public.rallies_scored with (security_invoker = true) as
select
  r.id, r.game_id, g.match_id, g.game_number, r.rally_number,
  m.player1_id, m.player2_id, m.date, m.ball_type, r.server_id,
  case when r.server_id = m.player1_id then m.player2_id
       when r.server_id = m.player2_id then m.player1_id end as receiver_id,
  r.winner_id, r.end_reason, r.error_detail, r.forced, r.shot_type,
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

create view public.errors_attributed with (security_invoker = true) as
select
  r.id as rally_id, r.game_id, g.match_id, r.rally_number,
  r.end_reason, r.error_detail, r.forced, r.winner_id,
  case when r.winner_id = m.player1_id then m.player2_id
       when r.winner_id = m.player2_id then m.player1_id end as error_maker_id
from public.rallies r
join public.games   g on g.id = r.game_id
join public.matches m on m.id = g.match_id
where r.end_reason in ('error', 'serve_fault');
