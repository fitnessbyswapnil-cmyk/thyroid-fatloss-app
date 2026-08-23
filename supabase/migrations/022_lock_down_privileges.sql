-- Close three privilege holes and one that locks clients out of their own recipes.
--
-- The pattern behind the first three: a policy was written with a "who may touch
-- this row" rule and no "what may they change" rule. Postgres reuses the first
-- as the second, so row access silently became column access.

-- ── 1. The signup trigger trusted user-supplied metadata for `role`. ────────
-- Anyone who could reach the signup endpoint could claim to be a coach and read
-- every client's medical record. The invite flow sets the row's role afterwards
-- through the admin API, so forcing a literal here costs nothing.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.clients (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    'client'   -- never from raw_user_meta_data; a coach is promoted deliberately
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── 2. A client could promote herself to coach. ─────────────────────────────
-- clients_update_own is USING (auth.uid() = id) with no WITH CHECK, so she may
-- rewrite any column on her own row. Onboarding legitimately writes weight,
-- condition, medications and allergies from the browser, so the fix cannot be a
-- blanket column revoke — it has to name the columns that decide access and money.
create or replace function public.freeze_privileged_client_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The admin API (service role) has no auth.uid(); the coach is trusted.
  if auth.uid() is null or public.is_coach() then
    return new;
  end if;

  new.role                := old.role;
  new.subscription_status := old.subscription_status;
  new.plan_type           := old.plan_type;
  new.start_date          := old.start_date;
  new.renewal_date        := old.renewal_date;

  -- Baseline weight is the denominator of every progress number she will ever
  -- see. Once onboarding is done it must not be rewritten — a client bounced
  -- back through onboarding by a failed query would otherwise silently reset it.
  if coalesce(old.onboarding_completed, false) then
    new.start_weight := old.start_weight;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_freeze_privileged_client_columns on public.clients;
create trigger trg_freeze_privileged_client_columns
  before update on public.clients
  for each row execute function public.freeze_privileged_client_columns();

-- ── 3. A client could edit the coach's messages. ────────────────────────────
-- msg_update is USING ((auth.uid() = client_id) OR is_coach()) with no WITH
-- CHECK, and `authenticated` held table-level UPDATE — so she could rewrite the
-- body of a message, or post one and flip from_coach to make it look like his.
-- The app only ever writes the two read flags, so grant exactly those.
revoke update on public.messages from authenticated;
grant update (read_by_client, read_by_coach) on public.messages to authenticated;

-- ── 4. Clients could not read the food library at all. ──────────────────────
-- The only policy was coach-only, so getFoodDetail and getSwapOptions returned
-- zero rows through a client's session: an empty recipe sheet and an empty swap
-- list for every client, failing silently. The library is reference data, not
-- client data — every signed-in user may read it, and only the coach may write.
drop policy if exists foods_read_authenticated on public.foods;
create policy foods_read_authenticated
  on public.foods for select
  to authenticated
  using (true);

comment on function public.freeze_privileged_client_columns is
  'Stops a client rewriting the columns that decide access, billing and her own baseline weight. The coach and the service role pass through.';
