import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export const runtime='nodejs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';

function dbFor(token:string){return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});}
function ref(table:string,id:string,label:string){return {table,id,label};}

export async function POST(req:NextRequest){
  const started=Date.now();
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!token||!url||!key)return NextResponse.json({error:'unauthorized'},{status:401});
  const db=dbFor(token);
  const {data:ud,error:ue}=await db.auth.getUser(token);
  if(ue||!ud.user)return NextResponse.json({error:'unauthorized'},{status:401});
  const body=await req.json().catch(()=>({}));
  const question=String(body.question||'').trim();
  if(!question)return NextResponse.json({error:'question_required'},{status:400});

  const [orgs,commitments,halts,venues,tasks,surveys,actions,festivals]=await Promise.all([
    db.from('organizations').select('id,name,state,district,city,pipeline_stage,next_followup_at,notes').limit(120),
    db.from('organization_commitments').select('id,organization_id,commitment_type,description,estimated_capacity,location,required_by,status,verification_status').limit(120),
    db.from('night_halts').select('id,survey_project_id,proposed_location,capacity_people,parking,food_arrangements,confirmation_status').limit(120),
    db.from('gathering_venues').select('id,survey_project_id,venue_type,venue_name,location_address,expected_number,venue_capacity,verification_status').limit(120),
    db.from('tasks').select('id,title,state,district,priority,status,due_at,organization_id').limit(120),
    db.from('survey_projects').select('id,state_name,status,revision,updated_at').limit(80),
    db.from('strategic_actions').select('id,survey_project_id,priority_key_issue,proposed_action,responsible_person_org,timeline,status,remarks').limit(120),
    db.from('events_festivals').select('id,survey_project_id,event_festival,start_date,end_date,location,expected_number,relevance_to_yatra_planning,coordination_notes').limit(120)
  ]);
  const failures=[orgs,commitments,halts,venues,tasks,surveys,actions,festivals].filter(x=>x.error).map(x=>x.error?.message);
  if(failures.length===8)return NextResponse.json({error:'no_authorized_data',detail:failures[0]},{status:403});

  const data={organizations:orgs.data||[],commitments:commitments.data||[],nightHalts:halts.data||[],venues:venues.data||[],tasks:tasks.data||[],surveys:surveys.data||[],strategicActions:actions.data||[],eventsFestivals:festivals.data||[]};
  const now=Date.now();
  const overdueCommitments=data.commitments.filter((x:any)=>x.required_by&&new Date(x.required_by).getTime()<now&&!['fulfilled','cancelled'].includes(x.status));
  const overdueTasks=data.tasks.filter((x:any)=>x.due_at&&new Date(x.due_at).getTime()<now&&!['completed','cancelled'].includes(x.status));
  const unconfirmedHalts=data.nightHalts.filter((x:any)=>x.confirmation_status!=='confirmed');
  const capacityRisks=data.venues.filter((x:any)=>x.expected_number&&x.venue_capacity&&Number(x.expected_number)>Number(x.venue_capacity));
  const facts={authorizedOrganizations:data.organizations.length,authorizedSurveys:data.surveys.length,commitments:data.commitments.length,overdueCommitments:overdueCommitments.length,overdueTasks:overdueTasks.length,proposedOrUnconfirmedNightHalts:unconfirmedHalts.length,venueCapacityRisks:capacityRisks.length};
  const sources=[
    ...data.surveys.slice(0,12).map((x:any)=>ref('survey_projects',x.id,`${x.state_name} survey (${x.status})`)),
    ...data.organizations.slice(0,20).map((x:any)=>ref('organizations',x.id,x.name)),
    ...data.venues.slice(0,12).map((x:any)=>ref('gathering_venues',x.id,x.venue_name)),
    ...data.nightHalts.slice(0,12).map((x:any)=>ref('night_halts',x.id,x.proposed_location)),
    ...data.commitments.slice(0,12).map((x:any)=>ref('organization_commitments',x.id,x.commitment_type))
  ].slice(0,45);

  let answer='';
  const apiKey=process.env.GEMINI_API_KEY;
  const model=process.env.AI_MODEL||'gemini-3.1-flash-lite';
  if(apiKey){
    try{
      const ai=new GoogleGenAI({apiKey});
      const context=JSON.stringify({facts,data},null,0).slice(0,85000);
      const prompt=`You are Ekatma Intelligence, an internal operational assistant. Answer ONLY from the authorized structured JSON below. Never invent organizations, people, commitments, capacities, dates, road conditions or statistics. Counts must use the provided deterministic facts. If evidence is absent, say that the authorized data does not establish it. Separate verified/recorded facts from analytical suggestions. Keep the answer concise and decision-oriented.\n\nQUESTION:\n${question}\n\nAUTHORIZED DATA:\n${context}`;
      const response=await ai.models.generateContent({model,contents:prompt});
      answer=String(response.text||'').trim();
    }catch{
      answer='AI language generation is temporarily unavailable. The deterministic authorized-data summary is still available below.';
    }
  } else {
    answer='AI language generation is not configured. Deterministic authorized-data metrics are available and the survey/CRM platform remains fully operational.';
  }

  const usage={feature:'intelligence_assistant',provider:apiKey?'gemini':'none',model:apiKey?model:null,input_tokens:0,output_tokens:0,latency_ms:Date.now()-started,success:true};
  await db.from('ai_usage').insert({user_id:ud.user.id,...usage});
  const {data:generation}=await db.from('ai_generations').insert({user_id:ud.user.id,feature:'intelligence_assistant',model_provider:apiKey?'gemini':'none',model_name:apiKey?model:null,prompt_template_version:'survey-crm-grounded-v1',source_refs:sources,result_text:answer,result_json:{facts},result_status:'completed',human_review_status:'review_required',latency_ms:Date.now()-started}).select('id').maybeSingle();

  return NextResponse.json({answer,facts,sources,reviewLabel:'AI-GENERATED — REVIEW REQUIRED',generationId:generation?.id||null,degraded:!apiKey,queryErrors:failures});
}
