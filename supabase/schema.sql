-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  template_id text not null default 'template-001',
  status text not null default 'draft' check (status in ('draft', 'published')),
  wedding_data jsonb not null default '{}'::jsonb,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invitations_slug_idx on public.invitations (slug);
create index if not exists invitations_owner_id_idx on public.invitations (owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at
before update on public.invitations
for each row execute function public.set_updated_at();

alter table public.invitations enable row level security;

grant select on public.invitations to anon, authenticated;
grant insert, update, delete on public.invitations to authenticated;

drop policy if exists "Public can read published invitations" on public.invitations;
create policy "Public can read published invitations"
on public.invitations for select to anon
using (status = 'published');

drop policy if exists "Owners can read invitations" on public.invitations;
create policy "Owners can read invitations"
on public.invitations for select to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners can create invitations" on public.invitations;
create policy "Owners can create invitations"
on public.invitations for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners can update invitations" on public.invitations;
create policy "Owners can update invitations"
on public.invitations for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Owners can delete invitations" on public.invitations;
create policy "Owners can delete invitations"
on public.invitations for delete to authenticated
using (owner_id = auth.uid());
