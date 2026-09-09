begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('simple-survey-evidence','simple-survey-evidence',false,20971520,array['image/jpeg','image/png','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','audio/mpeg','audio/mp4','audio/wav','audio/webm','video/mp4','video/webm'])
on conflict(id) do nothing;
create policy simple_evidence_read on storage.objects for select to authenticated using(bucket_id='simple-survey-evidence' and (public.can_manage_simple_surveys() or ((storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.simple_survey_assignments a where a.id::text=(storage.foldername(name))[2] and a.surveyor_id=auth.uid()))));
create policy simple_evidence_insert on storage.objects for insert to authenticated with check(bucket_id='simple-survey-evidence' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.simple_survey_assignments a where a.id::text=(storage.foldername(name))[2] and a.surveyor_id=auth.uid()) and not exists(select 1 from public.simple_survey_forms f where f.assignment_id::text=(storage.foldername(name))[2] and f.status in ('submitted','reviewed')));
commit;
