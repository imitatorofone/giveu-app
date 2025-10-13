-- Leaders/Admins can UPDATE needs in their org
create policy "leaders can update needs in org"
on public.needs
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles leader
    join public.profiles owner on owner.id = public.needs.created_by
    where leader.id = auth.uid()
      and leader.church_code = owner.church_code
      and leader.role in ('leader','admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles leader
    join public.profiles owner on owner.id = public.needs.created_by
    where leader.id = auth.uid()
      and leader.church_code = owner.church_code
      and leader.role in ('leader','admin')
  )
);

-- (Optional) Leaders/Admins can SELECT needs in their org (read access)
create policy "leaders can read needs in org"
on public.needs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles leader
    join public.profiles owner on owner.id = public.needs.created_by
    where leader.id = auth.uid()
      and leader.church_code = owner.church_code
      and leader.role in ('leader','admin')
  )
);
