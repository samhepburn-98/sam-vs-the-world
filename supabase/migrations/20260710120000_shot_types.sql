-- Shot tagging, simplified and extended. Three shot types carry real signal
-- at 2x-speed review: drive, boast, drop. The rest are retired — a kill is a
-- drive that died (remapped), while nick/volley/lob/other are modifiers or
-- non-tags with no honest mapping (nulled). Postgres can't drop enum values
-- in place, so the retired values stay in the type; the logger filters them
-- from its options (as with the retired double_bounce error detail) and this
-- CHECK keeps them out of new rows regardless of client.
update public.rallies set shot_type = 'drive' where shot_type = 'kill';
update public.rallies set shot_type = null
  where shot_type in ('nick', 'volley', 'lob', 'other');

alter table public.rallies add constraint rallies_shot_type_current
  check (shot_type is null or shot_type in ('drop', 'drive', 'boast'));

-- Widened semantics: shot_type is the rally WINNER's decisive shot — their
-- winner, their ace, or the shot that forced the error. Unforced errors have
-- no decisive shot by the winner, so they stay untagged; strokes, lets, and
-- serve faults never carry one.
alter table public.rallies drop constraint rallies_shot_type_scope;
alter table public.rallies add constraint rallies_shot_type_scope
  check (
    shot_type is null
    or end_reason in ('winner', 'ace')
    or (end_reason = 'error' and forced is true)
  );
