-- The protagonist flag (#104): the app has one first-person player — the
-- account owner the "vs the World" framing belongs to. Display-only: the
-- home screen features them and ordering prefers them; no stat treats them
-- differently. Exactly one player is expected to carry it, by convention
-- rather than constraint (a partial unique index would fight manage-page
-- editing flows for no real risk in a single-owner app).

alter table public.players
  add column is_protagonist boolean not null default false;

comment on column public.players.is_protagonist is
  'The first-person player the app fronts (home featured slot). Display-only.';

update public.players set is_protagonist = true where lower(name) = 'sam';
