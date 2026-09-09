import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import type {FieldDayDraft} from '@/lib/field';

export const runtime='nodejs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
const num=(v:any)=>String(v??'').trim()?Number(v):null;
const text=(v:any)=>String(v??'').trim()||null;

function clientFor(token:string){return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}})}
async function requireUser(req:NextRequest){const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!token||!url||!key)return null;const db=clientFor(token);const {data,error}=await db.auth.getUser(token);if(error||!data.user)return null;return {db,user:data.user}}

export async function POST(req:NextRequest){
  try{
    const auth=await requireUser(req);if(!auth)return NextResponse.json({error:'unauthorized'},{status:401});
    const day=(await req.json()) as FieldDayDraft;
    if(!day?.id||!day?.projectId||!day?.date)return NextResponse.json({error:'day_project_date_required'},{status:400});
    const {db,user}=auth;
    const {data:project,error:projectError}=await db.from('survey_projects').select('id,state_name').eq('id',day.projectId).maybeSingle();
    if(projectError||!project)return NextResponse.json({error:'survey_project_not_accessible'},{status:403});

    const now=new Date().toISOString();
    const daily={
      id:day.id,survey_project_id:day.projectId,activity_date:day.date,day_no:day.dayNo||1,
      journey_from:text(day.journeyFrom),journey_to:text(day.journeyTo),total_distance_km:num(day.distance),
      other_covered_places:text(day.otherCoveredPlaces),completed_tasks_activities:text(day.completedTasks),key_survey_findings:text(day.keyFindings),
      status:day.status||'draft',created_by:user.id,submitted_by:day.status==='submitted'?user.id:null,
      team_label:text(day.teamLabel),started_at:day.startedAt||now,submitted_at:day.status==='submitted'?(day.submittedAt||now):null,
      latitude:day.latitude??null,longitude:day.longitude??null,accuracy_meters:day.accuracyMeters??null,
      client_day_key:`field-day:${user.id}:${day.id}`,updated_at:now
    };
    const {error:dailyError}=await db.from('daily_logs').upsert(daily,{onConflict:'id'});if(dailyError)throw dailyError;

    const submission={client_submission_id:`field-day:${day.id}`,shankhdoot_id:user.id,form_type:'ekatma_daily_survey',payload:day,latitude:day.latitude??null,longitude:day.longitude??null,accuracy_meters:day.accuracyMeters??null,captured_at:day.startedAt||now,submitted_at:now,sync_status:'synced',local_record_key:day.id,verification_status:day.status==='submitted'?'pending':'draft'};
    const {error:submissionError}=await db.from('field_submissions').upsert(submission,{onConflict:'client_submission_id'});if(submissionError)throw submissionError;

    // Replace only records owned by this single daily report. Other teams/days are untouched.
    for(const table of ['daily_person_discussions','daily_organization_discussions']){const {error}=await db.from(table).delete().eq('daily_log_id',day.id);if(error)throw error}
    for(const table of ['gathering_venues','night_halts','rath_yatra_plans','events_festivals','strategic_actions','survey_organization_visits']){const {error}=await db.from(table).delete().eq('daily_log_id',day.id);if(error)throw error}

    if(day.persons?.length){const {error}=await db.from('daily_person_discussions').insert(day.persons.map((x,i)=>({id:x.id,daily_log_id:day.id,person_name:x.name||'Unnamed',discussion_completed:Boolean(x.discussion),discussion_notes:text(x.notes),sort_order:i})));if(error)throw error}
    if(day.organizations?.length){const {error}=await db.from('daily_organization_discussions').insert(day.organizations.map((x,i)=>({id:x.id,daily_log_id:day.id,organization_name:x.name||'Unnamed',discussion_completed:Boolean(x.discussion),discussion_notes:text(x.notes),sort_order:i})));if(error)throw error}

    for(const visit of day.organizationVisits||[]){
      let orgId=visit.organizationId||null;
      if(!orgId&&visit.name?.trim()){
        const {data:matches}=await db.from('organizations').select('id,name,general_phone').ilike('name',visit.name.trim()).eq('state',visit.state||day.state||project.state_name).limit(2);
        if(matches?.length===1&&(!visit.phone||!matches[0].general_phone||matches[0].general_phone===visit.phone))orgId=matches[0].id;
      }
      if(!orgId){
        orgId=crypto.randomUUID();
        const {error}=await db.from('organizations').insert({id:orgId,name:visit.name||'Unnamed organization',entity_type:visit.categories?.[0]||'Other',state:visit.state||day.state||project.state_name,district:text(visit.district),city:text(visit.city),full_address:text(visit.address),general_phone:text(visit.phone),general_email:visit.websiteEmail?.includes('@')?visit.websiteEmail:null,website:visit.websiteEmail?.startsWith('http')?visit.websiteEmail:null,notes:text(visit.otherDetails),record_source:'survey',created_by:user.id,updated_by:user.id,client_key:`field-org:${visit.id}`});if(error)throw error;
      }
      const {error:visitError}=await db.from('survey_organization_visits').insert({id:visit.id,survey_project_id:day.projectId,daily_log_id:day.id,organization_id:orgId,organization_name_observed:visit.name||'Unnamed',type_categories:visit.categories||[],full_address_observed:text(visit.address),city_observed:text(visit.city),district_observed:text(visit.district),state_observed:visit.state||day.state||project.state_name,phone_observed:text(visit.phone),head_representative_observed:text(visit.head),website_email_observed:text(visit.websiteEmail),other_relevant_details:text(visit.otherDetails),not_in_route:Boolean(visit.notInRoute),not_in_route_reason_relevance:text(visit.notInRouteReason),created_by:user.id});if(visitError)throw visitError;
      for(const c of visit.contacts||[]){
        const contactId=c.id;
        const {error}=await db.from('contacts').upsert({id:contactId,full_name:c.name||'Unnamed',designation:text(c.designation),primary_phone:text(c.phone),state:visit.state||day.state||project.state_name,notes:text(c.remarks),created_by:user.id,client_key:`field-contact:${c.id}`},{onConflict:'id'});if(error)throw error;
        const {error:linkError}=await db.from('organization_contacts').upsert({organization_id:orgId,contact_id:contactId,relationship_type:c.organizationRole||'Survey Contact',is_primary:false},{onConflict:'organization_id,contact_id'});if(linkError)throw linkError;
        const {error:obsError}=await db.from('survey_contact_observations').insert({id:c.id,survey_visit_id:visit.id,contact_id:contactId,name_observed:c.name||'Unnamed',designation_observed:text(c.designation),contact_number_observed:text(c.phone),organization_role_observed:text(c.organizationRole),remarks:text(c.remarks)});if(obsError)throw obsError;
      }
      if(visit.participation?.length){const {error}=await db.from('organization_participation').insert(visit.participation.map(p=>({id:crypto.randomUUID(),survey_visit_id:visit.id,participation_type:p.toLowerCase().replaceAll(' / ','_').replaceAll(' ','_'),selected:true})));if(error)throw error}
      if(visit.participation?.includes('Maha Rath Yatra')){const m=visit.mahaRath;const {error}=await db.from('maha_rath_participation').insert({id:crypto.randomUUID(),survey_visit_id:visit.id,proposed_location:text(m.proposedLocation),expected_participation:num(m.expectedParticipation),venue_details:text(m.venueDetails),parking_availability:text(m.parking),accommodation:text(m.accommodation),local_coordination:text(m.localCoordination),other_logistics:text(m.otherLogistics),remarks:text(m.remarks)});if(error)throw error}
      for(const area of visit.supportAreas||[]){const {error}=await db.from('institutional_support').insert({id:crypto.randomUUID(),survey_visit_id:visit.id,support_area:area.toLowerCase().replaceAll(' / ','_').replaceAll(' ','_'),details:text(visit.supportRemarks)});if(error)throw error}
      for(const v of visit.venues||[]){const {error}=await db.from('gathering_venues').insert({id:v.id,survey_project_id:day.projectId,daily_log_id:day.id,survey_visit_id:visit.id,venue_type:v.type,venue_name:v.name||'Unnamed venue',location_address:text(v.address),expected_number:num(v.expected),venue_capacity:num(v.capacity),parking_logistics_arrangements:text(v.parkingLogistics),local_support:text(v.localSupport),remarks:text(v.remarks)});if(error)throw error}
      for(const h of visit.nightHalts||[]){const {error}=await db.from('night_halts').insert({id:h.id,survey_project_id:day.projectId,daily_log_id:day.id,survey_visit_id:visit.id,proposed_location:h.location||'Unnamed location',proposal_reason:text(h.reason),accommodation_availability:text(h.accommodationAvailability),distance_from_route_km:num(h.distanceFromRoute),accommodation_type:text(h.accommodationType),parking:text(h.parking),capacity_people:num(h.capacity),food_arrangements:text(h.food),available_facilities:text(h.facilities),other_considerations:text(h.other)});if(error)throw error}
    }

    for(const r of day.rathPlans||[]){
      const {error}=await db.from('rath_yatra_plans').insert({id:r.id,survey_project_id:day.projectId,daily_log_id:day.id,rath_yatra_name:r.name||'Unnamed Rath Yatra',route_from:text(r.from),route_to:text(r.to),joining_point_maha_rath:text(r.joinPoint),original_plan_remarks:text(r.originalPlan),expected_joining_count:num(r.expectedJoiningCount),proposed_route:r.proposedRoute||[],key_activities:text(r.keyActivities),arrival_time:r.arrivalTime||null,arrival_location:text(r.arrivalLocation),vehicle_count:num(r.vehicleCount),vehicle_type_details:text(r.vehicleDetails),expected_number:num(r.expectedNumber),accommodation_capacity:num(r.accommodationCapacity),parking_capacity:num(r.parkingCapacity),other_available_facilities:text(r.otherFacilities),other_details_remarks:text(r.remarks)});if(error)throw error;
      if(r.stops?.length){const {error:stopError}=await db.from('rath_route_stops').insert(r.stops.map((s,i)=>({id:s.id,rath_yatra_plan_id:r.id,sequence_no:i+1,location_name:s.location||'Unnamed',estimated_arrival_time:s.arrivalTime||null,halt_duration_minutes:num(s.haltDuration),available_facilities:text(s.facilities),remarks:text(s.remarks)})));if(stopError)throw stopError}
    }
    if(day.festivals?.length){const {error}=await db.from('events_festivals').insert(day.festivals.map(x=>({id:x.id,survey_project_id:day.projectId,daily_log_id:day.id,event_festival:x.name||'Unnamed',start_date:x.startDate||null,end_date:x.endDate||null,duration_text:text(x.duration),location:text(x.location),expected_number:num(x.expectedNumber),relevance_to_yatra_planning:text(x.relevance),coordination_notes:text(x.coordinationNotes),key_observations_scheduling:text(x.observations)})));if(error)throw error}
    if(day.strategicActions?.length){const {error}=await db.from('strategic_actions').insert(day.strategicActions.map((x,i)=>({id:x.id,survey_project_id:day.projectId,daily_log_id:day.id,priority_key_issue:x.issue||'Unspecified issue',proposed_action:text(x.action),responsible_person_org:text(x.responsible),timeline:text(x.timeline),status:x.status||'open',remarks:text(x.remarks),sort_order:i})));if(error)throw error}

    return NextResponse.json({ok:true,dailyLogId:day.id,status:day.status,syncedAt:now});
  }catch(e:any){console.error('field_day_sync_failed',e?.message||e);return NextResponse.json({error:'field_day_sync_failed',detail:e?.message||'unknown_error'},{status:500})}
}
