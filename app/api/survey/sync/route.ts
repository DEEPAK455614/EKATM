import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SurveyDraft } from '@/lib/survey';

export const runtime = 'nodejs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const n=(v:string)=>v?.trim()?Number(v):null;
const nonempty=(v:string)=>v?.trim()||null;

function clientFor(token:string){
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
}

async function requireUser(req:NextRequest){
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token||!url||!key) return null;
  const db=clientFor(token);
  const {data,error}=await db.auth.getUser(token);
  if(error||!data.user) return null;
  return {db,user:data.user,token};
}

export async function POST(req:NextRequest){
  try{
    const auth=await requireUser(req);
    if(!auth) return NextResponse.json({error:'unauthorized'},{status:401});
    const draft=(await req.json()) as SurveyDraft;
    if(!draft?.projectId||!draft?.state?.trim()) return NextResponse.json({error:'state_and_project_required'},{status:400});
    const {db,user}=auth;

    const project={id:draft.projectId,state_name:draft.state.trim(),survey_period_start:draft.surveyStart||null,survey_period_end:draft.surveyEnd||null,status:draft.status||'draft',revision:draft.revision||1,created_by:user.id,updated_at:new Date().toISOString()};
    const {error:pe}=await db.from('survey_projects').upsert(project,{onConflict:'id'});
    if(pe) throw pe;

    const submission={client_submission_id:`survey:${draft.projectId}`,shankhdoot_id:user.id,form_type:'ekatma_state_survey',payload:draft,captured_at:new Date().toISOString(),sync_status:'synced',local_record_key:draft.id,verification_status:draft.status==='submitted'?'pending':'draft'};
    const {error:se}=await db.from('field_submissions').upsert(submission,{onConflict:'client_submission_id'});
    if(se) throw se;

    for(const table of ['state_profiles','district_features','daily_logs','survey_organization_visits','gathering_venues','night_halts','rath_yatra_plans','events_festivals','strategic_actions','survey_decisions_followups','committees','final_route_days']){
      const {error}=await db.from(table).delete().eq('survey_project_id',draft.projectId);
      if(error) throw error;
    }

    const sp=draft.stateProfile;
    const {error:spe}=await db.from('state_profiles').insert({id:crypto.randomUUID(),survey_project_id:draft.projectId,total_population:n(sp.totalPopulation),total_area_sq_km:n(sp.totalArea),total_districts:n(sp.totalDistricts),municipal_corporations_mandals:n(sp.municipalCorporationsMandals),municipalities_tehsils:n(sp.municipalitiesTehsils),gram_panchayats:n(sp.gramPanchayats)});
    if(spe) throw spe;

    if(draft.team.length){
      const {error}=await db.from('survey_team_members').delete().eq('survey_project_id',draft.projectId); if(error) throw error;
      const {error:e}=await db.from('survey_team_members').insert(draft.team.map((x,i)=>({id:x.id,survey_project_id:draft.projectId,team_member_name:x.name||'Unnamed',role_responsibility:nonempty(x.role),contact_number:nonempty(x.contact),allocated_area:nonempty(x.area),remarks:nonempty(x.remarks),sort_order:i}))); if(e) throw e;
    }
    if(draft.districts.length){const {error}=await db.from('district_features').insert(draft.districts.map((x,i)=>({id:x.id,survey_project_id:draft.projectId,district_name:x.districtName||'Unnamed',key_features:nonempty(x.keyFeatures),sort_order:i})));if(error)throw error;}

    for(const log of draft.dailyLogs){
      const {error}=await db.from('daily_logs').insert({id:log.id,survey_project_id:draft.projectId,activity_date:log.date||new Date().toISOString().slice(0,10),day_no:log.dayNo||1,journey_from:nonempty(log.from),journey_to:nonempty(log.to),total_distance_km:n(log.distance),other_covered_places:nonempty(log.otherPlaces),completed_tasks_activities:nonempty(log.completedTasks),key_survey_findings:nonempty(log.findings),created_by:user.id}); if(error) throw error;
      if(log.persons.length){const {error:e}=await db.from('daily_person_discussions').insert(log.persons.map((x,i)=>({id:x.id,daily_log_id:log.id,person_name:x.name||'Unnamed',discussion_completed:x.discussion,discussion_notes:nonempty(x.notes),sort_order:i})));if(e)throw e;}
      if(log.organizations.length){const {error:e}=await db.from('daily_organization_discussions').insert(log.organizations.map((x,i)=>({id:x.id,daily_log_id:log.id,organization_name:x.name||'Unnamed',discussion_completed:x.discussion,discussion_notes:nonempty(x.notes),sort_order:i})));if(e)throw e;}
    }

    for(const visit of draft.organizationVisits){
      let orgId=visit.organizationId||null;
      if(!orgId){
        const {data:matches}=await db.from('organizations').select('id,name,general_phone').ilike('name',visit.name.trim()).eq('state',visit.state||draft.state).limit(2);
        if(matches?.length===1 && (!visit.phone || !matches[0].general_phone || matches[0].general_phone===visit.phone)) orgId=matches[0].id;
      }
      if(!orgId){
        orgId=visit.id;
        const {error}=await db.from('organizations').insert({id:orgId,name:visit.name||'Unnamed organization',entity_type:visit.categories[0]||'Other',state:visit.state||draft.state,district:nonempty(visit.district),city:nonempty(visit.city),full_address:nonempty(visit.address),general_phone:nonempty(visit.phone),general_email:visit.websiteEmail.includes('@')?visit.websiteEmail:null,website:visit.websiteEmail.startsWith('http')?visit.websiteEmail:null,notes:nonempty(visit.otherDetails),record_source:'survey',created_by:user.id,updated_by:user.id,client_key:`survey-org:${visit.id}`}); if(error) throw error;
      }
      const {error:ve}=await db.from('survey_organization_visits').insert({id:visit.id,survey_project_id:draft.projectId,organization_id:orgId,organization_name_observed:visit.name||'Unnamed',type_categories:visit.categories,full_address_observed:nonempty(visit.address),city_observed:nonempty(visit.city),district_observed:nonempty(visit.district),state_observed:visit.state||draft.state,phone_observed:nonempty(visit.phone),head_representative_observed:nonempty(visit.head),website_email_observed:nonempty(visit.websiteEmail),other_relevant_details:nonempty(visit.otherDetails),not_in_route:visit.notInRoute,not_in_route_reason_relevance:nonempty(visit.notInRouteReason),created_by:user.id}); if(ve) throw ve;
      for(const c of visit.contacts){
        const contactId=c.id;
        const {error:ce}=await db.from('contacts').upsert({id:contactId,full_name:c.name||'Unnamed',designation:nonempty(c.designation),primary_phone:nonempty(c.phone),state:visit.state||draft.state,notes:nonempty(c.remarks),created_by:user.id,client_key:`survey-contact:${c.id}`},{onConflict:'id'}); if(ce) throw ce;
        const {error:le}=await db.from('organization_contacts').upsert({organization_id:orgId,contact_id:contactId,relationship_type:c.organizationRole||'Survey Contact',is_primary:false},{onConflict:'organization_id,contact_id'}); if(le) throw le;
        const {error:oe}=await db.from('survey_contact_observations').insert({id:c.id,survey_visit_id:visit.id,contact_id:contactId,name_observed:c.name||'Unnamed',designation_observed:nonempty(c.designation),contact_number_observed:nonempty(c.phone),organization_role_observed:nonempty(c.organizationRole),remarks:nonempty(c.remarks)}); if(oe) throw oe;
      }
      if(visit.participation.length){const rows=visit.participation.map(p=>({id:crypto.randomUUID(),survey_visit_id:visit.id,participation_type:p.toLowerCase().replaceAll(' / ','_').replaceAll(' ','_'),selected:true}));const {error}=await db.from('organization_participation').insert(rows);if(error)throw error;}
      if(visit.participation.includes('Maha Rath Yatra')){const m=visit.mahaRath;const {error}=await db.from('maha_rath_participation').insert({id:crypto.randomUUID(),survey_visit_id:visit.id,proposed_location:nonempty(m.proposedLocation),expected_participation:n(m.expectedParticipation),venue_details:nonempty(m.venueDetails),parking_availability:nonempty(m.parking),accommodation:nonempty(m.accommodation),local_coordination:nonempty(m.localCoordination),other_logistics:nonempty(m.otherLogistics),remarks:nonempty(m.remarks)});if(error)throw error;}
      for(const area of visit.supportAreas){const type=area.toLowerCase().replaceAll(' / ','_').replaceAll(' ','_');const {error}=await db.from('institutional_support').insert({id:crypto.randomUUID(),survey_visit_id:visit.id,support_area:type,details:nonempty(visit.supportRemarks)});if(error)throw error;}
      for(const v of visit.venues){const {error}=await db.from('gathering_venues').insert({id:v.id,survey_project_id:draft.projectId,survey_visit_id:visit.id,venue_type:v.type,venue_name:v.name||'Unnamed venue',location_address:nonempty(v.address),expected_number:n(v.expected),venue_capacity:n(v.capacity),parking_logistics_arrangements:nonempty(v.parkingLogistics),local_support:nonempty(v.localSupport),remarks:nonempty(v.remarks)});if(error)throw error;}
      for(const h of visit.nightHalts){const {error}=await db.from('night_halts').insert({id:h.id,survey_project_id:draft.projectId,survey_visit_id:visit.id,proposed_location:h.location||'Unnamed location',proposal_reason:nonempty(h.reason),accommodation_availability:nonempty(h.accommodationAvailability),distance_from_route_km:n(h.distanceFromRoute),accommodation_type:nonempty(h.accommodationType),parking:nonempty(h.parking),capacity_people:n(h.capacity),food_arrangements:nonempty(h.food),available_facilities:nonempty(h.facilities),other_considerations:nonempty(h.other)});if(error)throw error;}
    }

    for(const r of draft.rathPlans){const {error}=await db.from('rath_yatra_plans').insert({id:r.id,survey_project_id:draft.projectId,rath_yatra_name:r.name||'Unnamed Rath Yatra',route_from:nonempty(r.from),route_to:nonempty(r.to),joining_point_maha_rath:nonempty(r.joinPoint),original_plan_remarks:nonempty(r.originalPlan),expected_joining_count:n(r.expectedJoiningCount),proposed_route:r.proposedRoute,key_activities:nonempty(r.keyActivities),arrival_time:r.arrivalTime||null,arrival_location:nonempty(r.arrivalLocation),vehicle_count:n(r.vehicleCount),vehicle_type_details:nonempty(r.vehicleDetails),expected_number:n(r.expectedNumber),accommodation_capacity:n(r.accommodationCapacity),parking_capacity:n(r.parkingCapacity),other_available_facilities:nonempty(r.otherFacilities),other_details_remarks:nonempty(r.remarks)});if(error)throw error;if(r.stops.length){const {error:e}=await db.from('rath_route_stops').insert(r.stops.map((s,i)=>({id:s.id,rath_yatra_plan_id:r.id,sequence_no:i+1,location_name:s.location||'Unnamed',estimated_arrival_time:s.arrivalTime||null,halt_duration_minutes:n(s.haltDuration),available_facilities:nonempty(s.facilities),remarks:nonempty(s.remarks)})));if(e)throw e;}}
    if(draft.festivals.length){const {error}=await db.from('events_festivals').insert(draft.festivals.map(x=>({id:x.id,survey_project_id:draft.projectId,event_festival:x.name||'Unnamed',start_date:x.startDate||null,end_date:x.endDate||null,duration_text:nonempty(x.duration),location:nonempty(x.location),expected_number:n(x.expectedNumber),relevance_to_yatra_planning:nonempty(x.relevance),coordination_notes:nonempty(x.coordinationNotes),key_observations_scheduling:nonempty(x.observations)})));if(error)throw error;}
    if(draft.strategicActions.length){const {error}=await db.from('strategic_actions').insert(draft.strategicActions.map((x,i)=>({id:x.id,survey_project_id:draft.projectId,priority_key_issue:x.issue||'Unspecified issue',proposed_action:nonempty(x.action),responsible_person_org:nonempty(x.responsible),timeline:nonempty(x.timeline),status:x.status||'open',remarks:nonempty(x.remarks),sort_order:i})));if(error)throw error;}
    if(draft.decisionsFollowup.trim()){const {error}=await db.from('survey_decisions_followups').insert({id:crypto.randomUUID(),survey_project_id:draft.projectId,body:draft.decisionsFollowup,created_by:user.id});if(error)throw error;}
    for(const level of ['national','state','district'] as const){const members=draft.committees[level];if(!members.length)continue;const cid=crypto.randomUUID();const {error}=await db.from('committees').insert({id:cid,survey_project_id:draft.projectId,committee_level:level,state:level!=='national'?draft.state:null,status:'proposed'});if(error)throw error;const {error:e}=await db.from('committee_members').insert(members.map((m,i)=>({id:m.id,committee_id:cid,name_designation:m.nameDesignation||'Unnamed',institution_organization:nonempty(m.institution),mobile:nonempty(m.mobile),email:nonempty(m.email),city:nonempty(m.city),state:nonempty(m.state)||draft.state,district:nonempty(m.district),address:nonempty(m.address),sort_order:i})));if(e)throw e;}
    if(draft.finalRoute.length){const {error}=await db.from('final_route_days').insert(draft.finalRoute.map(x=>({id:x.id,survey_project_id:draft.projectId,day_no:x.dayNo,route_date:x.date||null,route_from:nonempty(x.from),route_to:nonempty(x.to),distance_km:n(x.distance),intermediate_places:nonempty(x.intermediatePlaces),halt_venue:nonempty(x.haltVenue),activities:nonempty(x.activities),remarks:nonempty(x.remarks)})));if(error)throw error;}

    if(draft.status==='submitted') await db.from('survey_reviews').insert({survey_project_id:draft.projectId,action:'submit',actor_id:user.id,notes:'Submitted from field PWA'});
    return NextResponse.json({ok:true,projectId:draft.projectId,status:draft.status,syncedAt:new Date().toISOString()});
  }catch(e:any){
    console.error('survey_sync_failed',e?.message||e);
    return NextResponse.json({error:'survey_sync_failed',detail:e?.message||'unknown_error'},{status:500});
  }
}
