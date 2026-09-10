begin;
alter table public.simple_survey_forms drop constraint if exists simple_survey_forms_status_check;
alter table public.simple_survey_forms add constraint simple_survey_forms_status_check check(status in ('draft','submitted','under_review','reviewed','correction_requested'));
-- Keep legacy reviewed/correction_requested storage values for rollback compatibility.
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
 if f.status in ('submitted','under_review','reviewed') then raise exception 'This survey is locked for review. Ask the administrator to request a correction.'; end if;
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
 if p_status not in ('under_review','reviewed','correction_requested') then raise exception 'Invalid review status'; end if;
 if p_status='correction_requested' and length(btrim(coalesce(p_notes,'')))<3 then raise exception 'Explain what the surveyor needs to correct'; end if;
 select * into f from public.simple_survey_forms where id=p_form_id for update;
 if not found then raise exception 'Survey not found'; end if;
 if f.revision<>p_expected_revision then raise exception 'The survey changed. Refresh before reviewing.' using errcode='40001'; end if;
 if p_status='under_review' and f.status<>'submitted' then raise exception 'Only a submitted survey can enter review'; end if;
 if p_status='reviewed' and f.status not in ('submitted','under_review') then raise exception 'Only a submitted survey can be approved'; end if;
 update public.simple_survey_forms set status=p_status,review_notes=nullif(btrim(p_notes),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now(),revision=revision+1 where id=p_form_id returning * into f;
 update public.simple_survey_assignments set status=case when p_status='reviewed' then 'reviewed' when p_status='under_review' then 'submitted' else 'in_progress' end,updated_at=now() where id=f.assignment_id;
 insert into public.simple_survey_versions(form_id,revision,actor_id,status,form_data,review_notes) values(f.id,f.revision,auth.uid(),f.status,f.form_data,f.review_notes);
 return f;
end $$;
revoke all on function public.save_simple_survey(uuid,jsonb,boolean,integer),public.review_simple_survey(uuid,text,text,integer) from public,anon;
grant execute on function public.save_simple_survey(uuid,jsonb,boolean,integer),public.review_simple_survey(uuid,text,text,integer) to authenticated;

drop policy if exists simple_evidence_insert on storage.objects;
create policy simple_evidence_insert on storage.objects for insert to authenticated with check(bucket_id='simple-survey-evidence' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.simple_survey_assignments a where a.id::text=(storage.foldername(name))[2] and a.surveyor_id=auth.uid()) and not exists(select 1 from public.simple_survey_forms f where f.assignment_id::text=(storage.foldername(name))[2] and f.status in ('submitted','under_review','reviewed')));
update storage.buckets set allowed_mime_types=array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','audio/mpeg','audio/mp4','audio/wav','audio/webm','video/mp4','video/webm'] where id='simple-survey-evidence';
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='simple_survey_forms') then alter publication supabase_realtime add table public.simple_survey_forms; end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='simple_survey_assignments') then alter publication supabase_realtime add table public.simple_survey_assignments; end if;
 end if;
end $$;
commit;
