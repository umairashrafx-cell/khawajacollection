-- Staff accounts.
--
-- WHY THIS TABLE EXISTS INSTEAD OF `auth.users.raw_app_meta_data`.
--
-- The first attempt put `{"role":"admin"}` into raw_app_meta_data, on the
-- reasoning that a customer cannot write their own app_metadata (unlike
-- user_metadata, which the account page writes for a display name). That
-- reasoning was right and the storage was wrong: GoTrue REWRITES
-- raw_app_meta_data on sign-in, resetting it to {provider, providers}. The
-- grant survived until the admin signed in, and then silently vanished —
-- observed on this project, twice.
--
-- A table of our own is never touched by the auth server, so a grant is
-- permanent until someone deletes the row.
--
-- The security property is preserved by RLS below: a signed-in user may read
-- their OWN row and nothing else, and there is no insert, update or delete
-- policy at all. Granting admin therefore requires the service role or the SQL
-- editor — exactly the friction it should have — while checking admin needs
-- only the caller's own token, so it keeps working even if the service role key
-- is unset.

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  -- Who this is and why, so a stale grant can be recognised later.
  note text
);

alter table admins enable row level security;

-- Read your own row. This is what lets /api/admin/whoami answer without the
-- service role: the caller's own JWT is sufficient to learn whether the caller
-- is staff, which is a fact the UI shows them anyway.
create policy "staff can see their own admin row"
  on admins for select
  to authenticated
  using (auth.uid() = user_id);

-- Deliberately absent: any insert, update or delete policy. Nothing reachable
-- from a browser may create an administrator.
