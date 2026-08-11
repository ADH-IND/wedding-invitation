-- Jalankan setelah supabase/schema.sql.
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.invitations(id) on delete cascade,
  guest_name text not null,
  attendance text not null,
  guest_count integer not null default 0,
  message text not null,
  created_at timestamptz not null default now(),
  constraint rsvps_guest_name_length_check
    check (char_length(btrim(guest_name)) between 1 and 100),
  constraint rsvps_message_length_check
    check (char_length(btrim(message)) between 1 and 500),
  constraint rsvps_attendance_check
    check (attendance in ('hadir', 'tidak_hadir')),
  constraint rsvps_guest_count_range_check
    check (guest_count between 0 and 20),
  constraint rsvps_attendance_guest_count_check
    check (
      (attendance = 'hadir' and guest_count between 1 and 20)
      or (attendance = 'tidak_hadir' and guest_count = 0)
    )
);

create index if not exists rsvps_wedding_id_idx on public.rsvps (wedding_id);
create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);

alter table public.rsvps enable row level security;

revoke all on table public.rsvps from public;
revoke all on table public.rsvps from anon, authenticated;
grant insert on table public.rsvps to anon, authenticated;
grant select on table public.rsvps to authenticated;

create or replace function public.is_published_invitation(p_wedding_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invitations as i
    where i.id = p_wedding_id
      and i.status = 'published'
  );
$$;

revoke all on function public.is_published_invitation(uuid) from public;
grant execute on function public.is_published_invitation(uuid) to anon, authenticated;

drop policy if exists "Public can submit RSVP to published invitations" on public.rsvps;
create policy "Public can submit RSVP to published invitations"
on public.rsvps for insert to anon, authenticated
with check (public.is_published_invitation(wedding_id));

drop policy if exists "Owners can read RSVP for their invitations" on public.rsvps;
create policy "Owners can read RSVP for their invitations"
on public.rsvps for select to authenticated
using (
  exists (
    select 1
    from public.invitations
    where invitations.id = rsvps.wedding_id
      and invitations.owner_id = auth.uid()
  )
);

create or replace function public.get_public_rsvp_messages(p_wedding_id uuid)
returns table (
  id uuid,
  guest_name text,
  message text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select r.id, r.guest_name, r.message, r.created_at
  from public.rsvps as r
  where r.wedding_id = p_wedding_id
    and btrim(r.message) <> ''
    and public.is_published_invitation(p_wedding_id)
  order by r.created_at desc
  limit 200;
$$;

revoke all on function public.get_public_rsvp_messages(uuid) from public;
grant execute on function public.get_public_rsvp_messages(uuid) to anon, authenticated;
