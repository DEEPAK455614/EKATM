-- Transactional production regression: no account or test data survives.
begin;
do $$
declare u uuid:=gen_random_uuid(); n integer;
begin
  insert into auth.users(id,email,raw_user_meta_data) values(u,'ekatm-regression-'||u||'@example.invalid','{"full_name":"Registration regression","role":"system_admin"}'::jsonb);
  select count(*) into n from public.profiles where id=u and full_name='Registration regression' and email is not null;
  if n<>1 then raise exception 'Profile creation failed'; end if;
  select count(*) into n from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=u and r.key='shankhdoot';
  if n<>1 then raise exception 'Surveyor role missing'; end if;
  if exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id where ur.user_id=u and r.key<>'shankhdoot') then raise exception 'Privilege escalation'; end if;
  if exists(select 1 from public.simple_survey_assignments where surveyor_id=u) then raise exception 'Unexpected assignment'; end if;
end $$;
rollback;
