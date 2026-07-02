-- House rules (§7.7): per-match serve rules and configurable parameters.
-- Defaults reproduce prior behaviour exactly (two serves, lets keep serve number).

alter table public.matches
  add column serves_per_point smallint not null default 2
    constraint matches_serves_per_point_check check (serves_per_point in (1, 2)),
  add column let_resets_serve boolean not null default false;

-- best-of any odd length 1-9 (was: 3 or 5)
alter table public.matches drop constraint matches_format_check;
alter table public.matches add constraint matches_format_check
  check (format is null or (format % 2 = 1 and format between 1 and 9));

-- the two-serve rule moves from a blind CHECK into the rule-aware trigger below
alter table public.rallies drop constraint rallies_fault_second_serve;

create or replace function public.rallies_validate_players()
returns trigger language plpgsql set search_path = '' as $$
declare p1 uuid; p2 uuid; spp smallint;
begin
  select m.player1_id, m.player2_id, m.serves_per_point into p1, p2, spp
  from public.games g join public.matches m on m.id = g.match_id
  where g.id = new.game_id;

  if new.server_id not in (p1, p2) then
    raise exception 'server_id % is not a player in this match', new.server_id;
  end if;
  if new.winner_id is not null and new.winner_id not in (p1, p2) then
    raise exception 'winner_id % is not a player in this match', new.winner_id;
  end if;

  -- per-match serve rules (§7.7)
  if new.serve_number > spp then
    raise exception 'serve_number % exceeds the match''s serves_per_point (%)', new.serve_number, spp;
  end if;
  if spp = 2 and new.end_reason = 'serve_fault' and new.serve_number <> 2 then
    raise exception 'in a two-serve match a point can only end on a second-serve fault';
  end if;
  return new;
end;
$$;

-- serves_per_point joins the fields locked once games exist (changing it could
-- invalidate logged rallies, same family as player immutability)
create or replace function public.matches_validate_player_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if (new.player1_id <> old.player1_id
      or new.player2_id <> old.player2_id
      or new.serves_per_point <> old.serves_per_point)
     and exists (select 1 from public.games g where g.match_id = new.id) then
    raise exception 'cannot change players or serve rules on a match that already has games';
  end if;
  return new;
end;
$$;
