begin;
create or replace function public.can_manage_simple_surveys() returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active) and (public.is_global_admin() or public.has_role('survey_lead') or public.has_role('state_coordinator') or public.has_role('survey_team_coordinator') or public.has_role('national_operations'));
$$;
alter table public.simple_survey_forms add column if not exists revision integer not null default 1;
create table if not exists public.simple_survey_versions (
 id uuid primary key default gen_random_uuid(), form_id uuid not null references public.simple_survey_forms(id) on delete cascade,
 revision integer not null, actor_id uuid references public.profiles(id), status text not null,
 form_data jsonb not null, review_notes text, created_at timestamptz not null default now(), unique(form_id,revision)
);
alter table public.simple_survey_versions enable row level security;
create policy simple_versions_read on public.simple_survey_versions for select to authenticated using(exists(select 1 from public.simple_survey_forms f where f.id=form_id and (f.surveyor_id=auth.uid() or public.can_manage_simple_surveys())));
grant select on public.simple_survey_versions to authenticated;
-- Writes go through RPCs, so role, ownership, review and revision rules cannot
-- be bypassed by modifying a browser request. Reads continue to use RLS.
revoke insert,update,delete on public.simple_survey_forms from authenticated,anon;
revoke insert,update,delete on public.simple_survey_versions from authenticated,anon;

create or replace function public.save_simple_survey(p_assignment_id uuid,p_form_data jsonb,p_submit boolean default false,p_expected_revision integer default 0)
returns public.simple_survey_forms language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.simple_survey_assignments; f public.simple_survey_forms; result public.simple_survey_forms; next_status text;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and active) then raise exception 'Sign in with an active surveyor account'; end if;
 select * into a from public.simple_survey_assignments where id=p_assignment_id and surveyor_id=auth.uid() for update;
 if not found then raise exception 'This State is not assigned to you'; end if;
 if jsonb_typeof(p_form_data)<>'object' or p_form_data is null or jsonb_typeof(p_form_data->'meta') is distinct from 'object' or jsonb_typeof(p_form_data->'dailyLogs') is distinct from 'array' then raise exception 'Invalid survey data'; end if;
 if octet_length(p_form_data::text)>5242880 then raise exception 'Survey is too large. Contact your administrator.'; end if;
 if p_submit and jsonb_array_length(p_form_data->'dailyLogs')=0 then raise exception 'Add at least one daily activity before submitting'; end if;
 select * into f from public.simple_survey_forms where assignment_id=a.id for update;
 if coalesce(f.revision,0)<>p_expected_revision then raise exception 'A newer version exists on the server. Refresh and compare your local draft before saving.' using errcode='40001'; end if;
 if f.status in ('submitted','reviewed') then raise exception 'This survey is locked for review. Ask the administrator to request a correction.'; end if;
 next_status:=case when p_submit then 'submitted' else 'draft' end;
 p_form_data:=jsonb_set(p_form_data,'{meta,state}',to_jsonb(a.state_name));
 insert into public.simple_survey_forms(assignment_id,surveyor_id,state_name,status,form_data,submitted_at,updated_at,revision)
 values(a.id,auth.uid(),a.state_name,next_status,p_form_data,case when p_submit then now() end,now(),1)
 on conflict(assignment_id) do update set form_data=excluded.form_data,status=excluded.status,submitted_at=excluded.submitted_at,updated_at=now(),revision=simple_survey_forms.revision+1,reviewed_at=null,reviewed_by=null
 returning * into result;
 update public.simple_survey_assignments set status=case when p_submit then 'submitted' else 'in_progress' end,updated_at=now() where id=a.id;
 insert into public.simple_survey_versions(form_id,revision,actor_id,status,form_data,review_notes) values(result.id,result.revision,auth.uid(),result.status,result.form_data,result.review_notes);
 return result;
end $$;

create or replace function public.review_simple_survey(p_form_id uuid,p_status text,p_notes text,p_expected_revision integer)
returns public.simple_survey_forms language plpgsql security definer set search_path=public,pg_temp as $$
declare f public.simple_survey_forms;
begin
 if not public.can_manage_simple_surveys() then raise exception 'Administrator access required'; end if;
 if p_status not in ('reviewed','correction_requested') then raise exception 'Invalid review status'; end if;
 if p_status='correction_requested' and length(btrim(coalesce(p_notes,'')))<3 then raise exception 'Explain what the surveyor needs to correct'; end if;
 select * into f from public.simple_survey_forms where id=p_form_id for update;
 if not found then raise exception 'Survey not found'; end if;
 if f.revision<>p_expected_revision then raise exception 'The survey changed. Refresh before reviewing.' using errcode='40001'; end if;
 if p_status='reviewed' and f.status<>'submitted' then raise exception 'Only a submitted survey can be marked reviewed'; end if;
 update public.simple_survey_forms set status=p_status,review_notes=nullif(btrim(p_notes),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now(),revision=revision+1 where id=p_form_id returning * into f;
 update public.simple_survey_assignments set status=case when p_status='reviewed' then 'reviewed' else 'in_progress' end,updated_at=now() where id=f.assignment_id;
 insert into public.simple_survey_versions(form_id,revision,actor_id,status,form_data,review_notes) values(f.id,f.revision,auth.uid(),f.status,f.form_data,f.review_notes);
 return f;
end $$;
revoke all on function public.save_simple_survey(uuid,jsonb,boolean,integer),public.review_simple_survey(uuid,text,text,integer) from public,anon;
grant execute on function public.save_simple_survey(uuid,jsonb,boolean,integer),public.review_simple_survey(uuid,text,text,integer) to authenticated;
-- Unassigned new accounts see their own profile, not the national directory.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.can_manage_simple_surveys() or public.has_permission('users.manage'));
commit;
