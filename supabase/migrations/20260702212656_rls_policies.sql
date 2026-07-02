create table public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
-- seed once:  insert into public.app_admins (user_id) values ('<your-auth-uid>');

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()));
$$;

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.games   enable row level security;
alter table public.rallies enable row level security;

create policy players_read on public.players for select to anon, authenticated using (true);
create policy matches_read on public.matches for select to anon, authenticated using (true);
create policy games_read   on public.games   for select to anon, authenticated using (true);
create policy rallies_read on public.rallies for select to anon, authenticated using (true);

create policy players_ins on public.players for insert to authenticated with check ((select public.is_owner()));
create policy players_upd on public.players for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy players_del on public.players for delete to authenticated using ((select public.is_owner()));
create policy matches_ins on public.matches for insert to authenticated with check ((select public.is_owner()));
create policy matches_upd on public.matches for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy matches_del on public.matches for delete to authenticated using ((select public.is_owner()));
create policy games_ins on public.games for insert to authenticated with check ((select public.is_owner()));
create policy games_upd on public.games for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy games_del on public.games for delete to authenticated using ((select public.is_owner()));
create policy rallies_ins on public.rallies for insert to authenticated with check ((select public.is_owner()));
create policy rallies_upd on public.rallies for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy rallies_del on public.rallies for delete to authenticated using ((select public.is_owner()));

create policy admins_read on public.app_admins for select to authenticated using ((select public.is_owner()));
