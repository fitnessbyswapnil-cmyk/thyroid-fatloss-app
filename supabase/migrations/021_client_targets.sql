-- Height and activity level, so calorie targets are calculated rather than guessed.
--
-- Without height, resting burn has to be estimated from weight alone, and that
-- estimate was out by up to 11% on a lighter client — enough to be the
-- difference between losing and stalling. No coefficient fixes it: the error
-- flips direction depending on build, so the number has to be collected.
--
-- Both are nullable. Existing clients keep working; the calculator falls back
-- and says plainly that it is estimating.

alter table public.clients
  add column if not exists height_cm numeric,
  add column if not exists activity_level text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clients_height_cm_sane'
  ) then
    alter table public.clients
      add constraint clients_height_cm_sane
      check (height_cm is null or (height_cm >= 100 and height_cm <= 250));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'clients_activity_level_valid'
  ) then
    alter table public.clients
      add constraint clients_activity_level_valid
      check (activity_level is null or activity_level in ('sedentary','light','moderate','active'));
  end if;
end $$;

comment on column public.clients.height_cm is 'Standing height in cm. Feeds the Mifflin-St Jeor calorie estimate in lib/plans/targets.ts.';
comment on column public.clients.activity_level is 'sedentary | light | moderate | active — the coach''s observation, not a device reading.';
