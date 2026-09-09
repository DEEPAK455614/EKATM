-- Public registration creates an unassigned surveyor only. Existing users and
-- administrator grants are untouched; identity metadata never selects a role.
begin;
drop trigger if exists guard_auth_user_registration on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_yatra on auth.users;
create or replace function public.handle_new_surveyor()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare surveyor_role uuid;
begin
  select id into strict surveyor_role from public.roles where key='shankhdoot';
  insert into public.profiles(id,full_name,email,phone,preferred_language)
  values(new.id,coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'),''),split_part(new.email,'@',1)),new.email,new.raw_user_meta_data->>'phone','English')
  on conflict(id) do update set email=excluded.email;
  insert into public.user_roles(user_id,role_id,active) values(new.id,surveyor_role,true) on conflict do nothing;
  return new;
end $$;
revoke all on function public.handle_new_surveyor() from public,anon,authenticated;
create trigger on_auth_surveyor_created after insert on auth.users for each row execute function public.handle_new_surveyor();
commit;
