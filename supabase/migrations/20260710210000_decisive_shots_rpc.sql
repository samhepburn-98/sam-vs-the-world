-- decisive_shots: the shot that ended the rally, counted per type, for both
-- sides of the player's rallies. Built on filtered_rallies like every other
-- insight (§8.4), so the counts can never drift from the rallies behind them.
--
--   winning_* — the player's decisive shots: rallies they WON whose
--               winning_shot is tagged (a clean winner, or the shot that
--               forced the error). Powers the Point-enders card.
--   losing_*  — the player's failed final shots: rallies they LOST whose
--               losing_shot is tagged (the botch that gave the point away).
--               Lets the Errors card show how points were lost, not just
--               where they landed.
--
-- Only 'drive' / 'drop' / 'boast' are tagged (the retired enum values are
-- locked out by CHECK), so three columns per side cover it. Counts, never a
-- bare rate (§3.5); the parts sum to the tagged total, and untagged decided
-- rallies simply aren't counted. SECURITY INVOKER, read-only, public execute.

create or replace function public.decisive_shots(
  p_player_id   uuid,
  p_opponent_id uuid default null,
  p_ball_type   public.ball_type default null,
  p_date_from   date default null,
  p_date_to     date default null
)
returns table (
  winning_drive integer,
  winning_drop  integer,
  winning_boast integer,
  losing_drive  integer,
  losing_drop   integer,
  losing_boast  integer
)
language sql stable
set search_path = ''
as $$
  select
    (count(*) filter (where fr.winner_id =  p_player_id and fr.winning_shot = 'drive'))::integer,
    (count(*) filter (where fr.winner_id =  p_player_id and fr.winning_shot = 'drop'))::integer,
    (count(*) filter (where fr.winner_id =  p_player_id and fr.winning_shot = 'boast'))::integer,
    (count(*) filter (where fr.winner_id <> p_player_id and fr.losing_shot  = 'drive'))::integer,
    (count(*) filter (where fr.winner_id <> p_player_id and fr.losing_shot  = 'drop'))::integer,
    (count(*) filter (where fr.winner_id <> p_player_id and fr.losing_shot  = 'boast'))::integer
  from public.filtered_rallies(p_player_id, p_opponent_id, p_ball_type, p_date_from, p_date_to) fr
  where fr.winner_id is not null
$$;

grant execute on function public.decisive_shots(uuid, uuid, public.ball_type, date, date) to anon, authenticated;
