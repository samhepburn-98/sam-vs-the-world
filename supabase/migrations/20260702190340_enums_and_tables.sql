create extension if not exists pgcrypto;

create type handedness   as enum ('left', 'right');
create type tiebreak     as enum ('win_by_2', 'sudden_death');
create type ball_type    as enum ('blue', 'red', 'yellow', 'double_yellow');
create type serve_side   as enum ('left', 'right');
create type end_reason   as enum ('winner', 'error', 'stroke', 'let', 'ace', 'serve_fault');
create type error_detail as enum ('tin', 'out_top', 'out_side', 'out_back', 'not_up', 'double_bounce');
create type shot_type    as enum ('drop', 'drive', 'kill', 'nick', 'boast', 'volley', 'lob', 'other');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  handedness  handedness,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.matches (
  id            uuid primary key default gen_random_uuid(),
  date          date not null default current_date,
  player1_id    uuid not null references public.players(id) on delete restrict,
  player2_id    uuid not null references public.players(id) on delete restrict,
  venue         text,
  format        smallint check (format in (3, 5)),
  target_score  smallint not null default 11 check (target_score > 0),
  tiebreak      tiebreak not null default 'win_by_2',
  ball_type     ball_type,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint matches_distinct_players check (player1_id <> player2_id)
);

create table public.games (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references public.matches(id) on delete cascade,
  game_number  smallint not null check (game_number > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint games_match_number_uniq unique (match_id, game_number)
);

create table public.rallies (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references public.games(id) on delete cascade,
  rally_number  smallint not null check (rally_number > 0),
  server_id     uuid not null references public.players(id) on delete restrict,
  serve_side    serve_side not null,
  serve_number  smallint not null check (serve_number in (1, 2)),
  winner_id     uuid references public.players(id) on delete restrict,
  end_reason    end_reason not null,
  error_detail  error_detail,
  forced        boolean,
  shot_type     shot_type,
  shot_count    smallint check (shot_count is null or shot_count >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- deferrable so a mid-game "insert missed rally" can renumber inside one transaction
  constraint rallies_game_number_uniq unique (game_id, rally_number) deferrable initially immediate,
  constraint rallies_let_null_winner check ((end_reason = 'let') = (winner_id is null)),
  constraint rallies_error_detail_scope check (
    error_detail is null or end_reason in ('error', 'serve_fault')
  ),
  constraint rallies_fault_second_serve check (
    end_reason <> 'serve_fault' or serve_number = 2
  ),
  constraint rallies_ace_winner_serves check (end_reason <> 'ace' or winner_id = server_id),
  constraint rallies_fault_receiver_wins check (end_reason <> 'serve_fault' or winner_id <> server_id),
  constraint rallies_forced_scope check (forced is null or end_reason = 'error'),
  constraint rallies_shot_type_scope check (shot_type is null or end_reason in ('winner', 'ace'))
);

create index matches_player1_idx on public.matches (player1_id);
create index matches_player2_idx on public.matches (player2_id);
create index matches_date_idx    on public.matches (date);
create index games_match_idx     on public.games   (match_id);
create index rallies_game_idx    on public.rallies (game_id);
create index rallies_server_idx  on public.rallies (server_id);
create index rallies_winner_idx  on public.rallies (winner_id);

create trigger players_set_updated_at before update on public.players
  for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches
  for each row execute function public.set_updated_at();
create trigger games_set_updated_at before update on public.games
  for each row execute function public.set_updated_at();
create trigger rallies_set_updated_at before update on public.rallies
  for each row execute function public.set_updated_at();

create or replace function public.rallies_validate_players()
returns trigger language plpgsql as $$
declare p1 uuid; p2 uuid;
begin
  select m.player1_id, m.player2_id into p1, p2
  from public.games g join public.matches m on m.id = g.match_id
  where g.id = new.game_id;

  if new.server_id not in (p1, p2) then
    raise exception 'server_id % is not a player in this match', new.server_id;
  end if;
  if new.winner_id is not null and new.winner_id not in (p1, p2) then
    raise exception 'winner_id % is not a player in this match', new.winner_id;
  end if;
  return new;
end;
$$;
create trigger rallies_validate_players before insert or update on public.rallies
  for each row execute function public.rallies_validate_players();

-- players are immutable once the match has games (silent-corruption guard: changing them would
-- orphan every rally's winner/server mapping in the derived views)
create or replace function public.matches_validate_player_change()
returns trigger language plpgsql as $$
begin
  if (new.player1_id <> old.player1_id or new.player2_id <> old.player2_id)
     and exists (select 1 from public.games g where g.match_id = new.id) then
    raise exception 'cannot change players on a match that already has games';
  end if;
  return new;
end;
$$;
create trigger matches_validate_player_change before update on public.matches
  for each row execute function public.matches_validate_player_change();
