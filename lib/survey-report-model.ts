import type {SimpleSurveyData} from './simple-survey';

export type ReportMeta = {status?:string;revision?:number;submittedAt?:string|null;updatedAt?:string;surveyor?:string|null;reviewNotes?:string|null};
export type ReportSection = {title:string;value:unknown};
const labels:Record<string,string>={dayNo:'Day number',discussion:'Discussion completed',websiteEmail:'Website / email',mobileEmail:'Mobile / email',notInRoute:'Not on the proposed route',dayId:'Linked survey day',uploadedAt:'Uploaded at'};
export const reportLabel=(key:string)=>(labels[key]||key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()));
export function reportSections(d:SimpleSurveyData,meta:ReportMeta={},dayId?:string):ReportSection[]{
 const days=[...d.dailyLogs].filter(x=>!dayId||x.id===dayId).sort((a,b)=>a.dayNo-b.dayNo);
 const attachments=(d.attachments||[]).filter(f=>!dayId||f.dayId===dayId).map(({path,id,dayId:linked,...f})=>({...f,linkedSurveyDay:linked?`Day ${d.dailyLogs.find(x=>x.id===linked)?.dayNo??'unavailable'}`:'Overall State survey'}));
 const sections:ReportSection[]=[{title:'Report overview',value:{state:d.meta.state,surveyor:meta.surveyor||d.meta.teamCoordinator,surveyPeriod:d.meta.surveyPeriod,status:meta.status||'Draft',revision:meta.revision,submittedAt:meta.submittedAt,lastSavedAt:meta.updatedAt,reportScope:dayId?'Selected daily activity and its linked evidence':'Complete cumulative State survey',surveyDays:days.length,...(!dayId?{organizationsRecorded:d.organizations.length,contactsRecorded:d.organizations.reduce((n,o)=>n+o.contacts.length,0),rathPlans:d.rathPlans.length,eventsRecorded:d.events.length,actionItems:d.strategicActions.length,proposedRouteDays:d.finalRoute.length}:{}),reviewNotes:meta.reviewNotes}},
 {title:'02 · State Survey Team',value:d.meta}];
 if(!dayId)sections.push({title:'03 · State at a Glance',value:d.stateProfile});
 sections.push({title:'04 · Daily Activity Log',value:days});
 if(!dayId)sections.push(
 {title:'05–08 · Organizations, Contacts, Participation & Logistics',value:d.organizations},
 {title:'09 · Rath Yatra Proposed Plan',value:d.rathPlans},
 {title:'10 · Events & Festivals',value:{events:d.events,observations:d.eventObservations}},
 {title:'11 · Strategic Planning & Action',value:{actions:d.strategicActions,importantDecisions:d.importantDecisions}},
 {title:'12 · Proposed National Committee',value:d.committees.national},
 {title:'13 · Proposed State Committee',value:d.committees.state},
 {title:'14 · Proposed District Committee',value:d.committees.district},
 {title:'15–16 · Final Route Plan',value:[...d.finalRoute].sort((a,b)=>a.dayNo-b.dayNo)});
 sections.push({title:'Supporting documents and evidence',value:attachments});
 return sections;
}

// One field model feeds both the screen report and downloads; internal IDs and
// private storage paths are never exported. Empty fields remain explicit.
export function reportEntries(value:object){return Object.entries(value).filter(([key,val])=>!['id','path'].includes(key)&&val!==undefined);}
export function reportLines(value:unknown,prefix=''):string[]{
 if(value===undefined)return [];
 if(value===null||value==='')return [`${prefix}Not recorded`];
 if(typeof value==='boolean')return [`${prefix}${value?'Yes':'No'}`];
 if(typeof value!=='object')return [`${prefix}${String(value)}`];
 if(Array.isArray(value))return value.length?value.flatMap((v,i)=>reportLines(v,`${prefix}${i+1}. `)):[`${prefix}No entries recorded`];
 return reportEntries(value).flatMap(([k,v])=>reportLines(v,`${prefix}${reportLabel(k)}: `));
}
