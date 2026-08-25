-- ---------------------------------------------------------------------------
-- Signature trait v2 (§3.2): a two-axis classification matrix instead of the
-- single rally-length differential.
--
--   Tempo (rows)  — where the game lives: short (1–3 shot) win rate minus
--                   extended (5+ shot) win rate. ±8 points marks a lean.
--   Agency (cols) — whose racket ends the points you win: share ended by
--                   your own clean winner or ace, versus the opponent's
--                   error / stroke / serve fault. ≥55% marks a finisher,
--                   ≤43% a pressure player.
--
--                 finisher     mixed        pressure
--   short-court   sniper       shotmaker    enforcer
--   all-court     marksman     all_rounder  grafter
--   long-court    hunter       grinder      wall
--
-- Guards: ≥30 rallies in each tempo bucket and ≥30 points won, else the
-- trait is null and the UI shows nothing — the old client-side average-length
-- fallback is retired with this migration (it could only ever say
-- "shotmaker" on this club's fast games). Extended is 5+ shots for the same
-- sample-size reason as the GRD attribute: 9+ alone never reaches 30.
--
-- The return tables gain clean_finish_wins / points_won so the UI can cite
-- the agency receipt (§3.5: numerators and denominators, never bare rates).
-- Band cutoffs were sanity-checked against the live data on 2026-08-25:
-- the three players land in three different cells (shotmaker / grafter /
-- marksman), and each axis value sits clear of its nearest cutoff.
-- ---------------------------------------------------------------------------

drop function if exists public.players_headline();
drop function if exists public.player_headline(uuid, uuid, public.ball_type, date, date);

create function public.player_headline(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  player_id        uuid,
  games_won        integer,
  games_decided    integer,
  matches_won      integer,
  matches_decided  integer,
  signature_trait  text,
  clean_finish_wins integer,
  points_won       integer,
  recent_games     jsonb
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
    t.clean_finish_wins,
    t.points_won,
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
      select
        c.clean_finish_wins,
        c.points_won,
        case
          when c.short_n >= 30 and c.ext_n >= 30 and c.points_won >= 30 then
            case
              -- tempo band first (rows), agency band inside it (columns)
              when c.short_wr - c.ext_wr >= 0.08 then
                case
                  when c.clean_share >= 0.55 then 'sniper'
                  when c.clean_share <= 0.43 then 'enforcer'
                  else 'shotmaker'
                end
              when c.ext_wr - c.short_wr >= 0.08 then
                case
                  when c.clean_share >= 0.55 then 'hunter'
                  when c.clean_share <= 0.43 then 'wall'
                  else 'grinder'
                end
              else
                case
                  when c.clean_share >= 0.55 then 'marksman'
                  when c.clean_share <= 0.43 then 'grafter'
                  else 'all_rounder'
                end
            end
        end as signature_trait
      from (
        select
          count(*) filter (where fr.shot_count between 1 and 3)  as short_n,
          count(*) filter (where fr.shot_count >= 5)             as ext_n,
          (count(*) filter (where fr.winner_id = p_player_id))::integer as points_won,
          (count(*) filter (where fr.winner_id = p_player_id
                              and fr.end_reason in ('winner', 'ace')))::integer
                                                                 as clean_finish_wins,
          avg((fr.winner_id = p_player_id)::int)
            filter (where fr.shot_count between 1 and 3)         as short_wr,
          avg((fr.winner_id = p_player_id)::int)
            filter (where fr.shot_count >= 5)                    as ext_wr,
          avg((fr.end_reason in ('winner', 'ace'))::int)
            filter (where fr.winner_id = p_player_id)            as clean_share
        from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
        where fr.winner_id is not null
      ) c
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

-- The batch variant for the home roster — unchanged in spirit, forwarding the
-- new columns.
create function public.players_headline()
returns table (
  player_id        uuid,
  name             text,
  handedness       public.handedness,
  games_won        integer,
  games_decided    integer,
  matches_won      integer,
  matches_decided  integer,
  signature_trait  text,
  clean_finish_wins integer,
  points_won       integer,
  recent_games     jsonb
)
language sql stable
set search_path = ''
as $$
  select
    p.id, p.name, p.handedness,
    h.games_won, h.games_decided, h.matches_won, h.matches_decided,
    h.signature_trait, h.clean_finish_wins, h.points_won, h.recent_games
  from public.players p
  cross join lateral public.player_headline(p.id) h
  order by p.name
$$;
