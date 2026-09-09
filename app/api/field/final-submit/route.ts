import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {aggregateMasterSurvey} from '@/lib/master-survey';
import type {FieldDayDraft} from '@/lib/field';
import type {TeamMember} from '@/lib/survey';

export const runtime='nodejs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
function clientFor(token:string){return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}})}
async function requireUser(req:NextRequest){const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!token||!url||!key)return null;const db=clientFor(token);const {data,error}=await db.auth.getUser(token);if(error||!data.user)return null;return {db,user:data.user}}

export async function POST(req:NextRequest){
  try{
    const auth=await requireUser(req);if(!auth)return NextResponse.json({error:'unauthorized'},{status:401});
    const body=await req.json();const projectId=String(body?.projectId||'');if(!projectId)return NextResponse.json({error:'project_required'},{status:400});
    const {db,user}=auth;
    const {data:project,error:projectError}=await db.from('survey_projects').select('id,state_name,status,survey_period_start,survey_period_end,coordinator_id').eq('id',projectId).maybeSingle();
    if(projectError||!project)return NextResponse.json({error:'survey_project_not_accessible'},{status:403});
    const [{data:teamRows,error:teamError},{data:subs,error:subError},{data:coordinator}]=await Promise.all([
      db.from('survey_team_members').select('team_member_name,role_responsibility,contact_number,allocated_area,remarks,sort_order').eq('survey_project_id',projectId).order('sort_order'),
      db.from('field_submissions').select('payload,submitted_at,verification_status').eq('survey_project_id',projectId).eq('form_type','ekatma_daily_survey').order('submitted_at',{ascending:true}),
      project.coordinator_id?db.from('profiles').select('full_name').eq('id',project.coordinator_id).maybeSingle():Promise.resolve({data:null} as any)
    ]);
    if(teamError)throw teamError;if(subError)throw subError;
    const days=(subs||[]).map(x=>x.payload as FieldDayDraft).filter(d=>d&&d.status==='submitted');
    if(!days.length)return NextResponse.json({error:'no_submitted_daily_reports',detail:'Submit at least one daily report before final submission.'},{status:400});
    const team:TeamMember[]=(teamRows||[]).map((x:any,i:number)=>({id:`team-${i}`,name:x.team_member_name||'',role:x.role_responsibility||'',contact:x.contact_number||'',area:x.allocated_area||'',remarks:x.remarks||''}));
    const master=aggregateMasterSurvey({id:project.id,state_name:project.state_name,status:'submitted',survey_period_start:project.survey_period_start,survey_period_end:project.survey_period_end,coordinator_name:(coordinator as any)?.full_name||''},team,days);
    const now=new Date().toISOString();
    const {data:existing}=await db.from('survey_final_submissions').select('id,version').eq('survey_project_id',projectId).maybeSingle();
    if(existing){
      const {error}=await db.from('survey_final_submissions').update({master_payload:master,submitted_by:user.id,submitted_at:now,status:'submitted',version:(existing.version||1)+1,reviewed_by:null,reviewed_at:null,review_notes:null,updated_at:now}).eq('id',existing.id);if(error)throw error;
    }else{
      const {error}=await db.from('survey_final_submissions').insert({survey_project_id:projectId,submitted_by:user.id,submitted_at:now,master_payload:master,status:'submitted',version:1});if(error)throw error;
    }
    await db.from('survey_report_snapshots').insert({survey_project_id:projectId,report_type:'final',report_date:new Date().toISOString().slice(0,10),payload:master,generated_by:user.id,version:existing?(existing.version||1)+1:1});
    const {error:projectUpdate}=await db.from('survey_projects').update({status:'submitted',updated_at:now}).eq('id',projectId);if(projectUpdate)throw projectUpdate;
    return NextResponse.json({ok:true,projectId,submittedAt:now,daysIncluded:days.length,master});
  }catch(e:any){console.error('final_survey_submit_failed',e?.message||e);return NextResponse.json({error:'final_survey_submit_failed',detail:e?.message||'unknown_error'},{status:500})}
}
