import type {SurveyDraft,TeamMember,DistrictFeature,OrgVisit,RathPlan,Festival,StrategicAction,CommitteeMember,RouteDay} from './survey';
import type {FieldDayDraft} from './field';

export type SurveyProjectContext={
  id:string;
  state_name:string;
  status:string;
  survey_period_start?:string|null;
  survey_period_end?:string|null;
  coordinator_name?:string|null;
};

const filled=(v:any)=>String(v??'').trim().length>0;
const latest=(days:FieldDayDraft[],pick:(d:FieldDayDraft)=>string)=>{
  for(let i=days.length-1;i>=0;i--){const value=pick(days[i]);if(filled(value))return value;}
  return '';
};
const uniqueBy=<T>(items:T[],key:(x:T)=>string)=>{
  const seen=new Set<string>();
  return items.filter(x=>{const k=key(x).trim().toLowerCase();if(!k)return false;if(seen.has(k))return false;seen.add(k);return true;});
};

export function aggregateMasterSurvey(project:SurveyProjectContext,team:TeamMember[],rawDays:FieldDayDraft[]):SurveyDraft{
  const days=[...rawDays].sort((a,b)=>(a.dayNo-b.dayNo)||a.date.localeCompare(b.date));
  const stateProfile={
    totalPopulation:latest(days,d=>d.stateProfile?.totalPopulation||''),
    totalArea:latest(days,d=>d.stateProfile?.totalArea||''),
    totalDistricts:latest(days,d=>d.stateProfile?.totalDistricts||''),
    municipalCorporationsMandals:latest(days,d=>d.stateProfile?.municipalCorporationsMandals||''),
    municipalitiesTehsils:latest(days,d=>d.stateProfile?.municipalitiesTehsils||''),
    gramPanchayats:latest(days,d=>d.stateProfile?.gramPanchayats||'')
  };
  const districts=uniqueBy(days.flatMap(d=>d.districts||[]),x=>x.districtName);
  const organizationVisits=uniqueBy(days.flatMap(d=>d.organizationVisits||[]),x=>x.id || `${x.name}|${x.city}|${x.district}`);
  const rathPlans=uniqueBy(days.flatMap(d=>d.rathPlans||[]),x=>x.id || x.name);
  const festivals=uniqueBy(days.flatMap(d=>d.festivals||[]),x=>x.id || `${x.name}|${x.location}|${x.startDate}`);
  const strategicActions=uniqueBy(days.flatMap(d=>d.strategicActions||[]),x=>x.id || `${x.issue}|${x.responsible}`);
  const committees={
    national:uniqueBy(days.flatMap(d=>d.committees?.national||[]),x=>x.id || `${x.nameDesignation}|${x.institution}`),
    state:uniqueBy(days.flatMap(d=>d.committees?.state||[]),x=>x.id || `${x.nameDesignation}|${x.institution}`),
    district:uniqueBy(days.flatMap(d=>d.committees?.district||[]),x=>x.id || `${x.nameDesignation}|${x.institution}|${x.district}`)
  };
  const finalRoute=uniqueBy(days.flatMap(d=>d.finalRoute||[]),x=>x.id || `${x.dayNo}|${x.date}|${x.from}|${x.to}`).sort((a,b)=>a.dayNo-b.dayNo);
  const dailyLogs=days.map(d=>({
    id:d.id,date:d.date,dayNo:d.dayNo,from:d.journeyFrom,to:d.journeyTo,distance:d.distance,
    persons:d.persons,organizations:d.organizations,otherPlaces:d.otherCoveredPlaces,completedTasks:d.completedTasks,findings:d.keyFindings
  }));
  return {
    id:project.id,projectId:project.id,revision:1,status:project.status||'in_progress',state:project.state_name,
    surveyStart:project.survey_period_start||'',surveyEnd:project.survey_period_end||'',coordinatorName:project.coordinator_name||'',team,
    stateProfile,districts,dailyLogs,organizationVisits,rathPlans,festivals,strategicActions,
    decisionsFollowup:days.map(d=>d.decisionsFollowup||'').filter(filled).join('\n\n'),committees,finalRoute,lastSavedAt:new Date().toISOString()
  };
}

export function surveyMasterStats(master:SurveyDraft){
  return {
    days:master.dailyLogs.length,
    organizations:master.organizationVisits.length,
    contacts:master.organizationVisits.reduce((n,o)=>n+o.contacts.length,0),
    venues:master.organizationVisits.reduce((n,o)=>n+o.venues.length,0),
    nightHalts:master.organizationVisits.reduce((n,o)=>n+o.nightHalts.length,0),
    rathPlans:master.rathPlans.length,
    festivals:master.festivals.length,
    actions:master.strategicActions.length,
    committeeMembers:master.committees.national.length+master.committees.state.length+master.committees.district.length,
    routeDays:master.finalRoute.length
  };
}
