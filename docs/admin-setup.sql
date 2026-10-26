begin;
create table if not exists public.awards_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.awards_admins enable row level security;
revoke all on public.awards_admins from public, anon, authenticated;
grant select on public.awards_admins to authenticated;
create policy "admins read own membership" on public.awards_admins for select to authenticated using (user_id = (select auth.uid()));
insert into public.awards_admins(user_id) values ('e102d57d-ba87-4828-8fcb-2a22bb89f7eb') on conflict do nothing;
drop policy "votes: read for authenticated" on public.votes;
create policy "votes: own or admin" on public.votes for select to authenticated
using (voter_id = (select auth.uid()) or exists (select 1 from public.awards_admins where user_id = (select auth.uid())));
alter view public.vote_counts set (security_invoker = true);
revoke all on public.vote_counts from public, anon, authenticated;
create or replace function public.admin_vote_results(p_edition uuid)
returns table(nominee_id uuid, total bigint)
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if not exists(select 1 from public.awards_admins where user_id = (select auth.uid())) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return query
    select n.id, count(v.id)
    from public.nominees n
    join public.categories c on c.id=n.category_id
    join public.editions e on e.id=c.edition_id
    left join public.votes v on v.nominee_id=n.id and v.category_id=c.id and v.edition_id=e.id
      and v.created_at >= e.starts_at and v.created_at <= e.ends_at
    where c.edition_id=p_edition group by n.id;
end;
$$;
revoke all on function public.admin_vote_results(uuid) from public, anon;
grant execute on function public.admin_vote_results(uuid) to authenticated;
commit;
