import type {SimpleSurveyData} from './simple-survey';
export type DirectoryEntry={kind:string;name:string;context:string;value:unknown};
export function surveyDirectory(d:SimpleSurveyData):DirectoryEntry[]{
 const rows:DirectoryEntry[]=[];const add=(kind:string,name:string,context:string,value:unknown)=>rows.push({kind,name:name||'Unnamed',context,value});
 for(const day of d.dailyLogs||[])for(const p of day.persons||[])add('Person',p.name,`${d.organizations.find(o=>o.id===p.organizationId)?.name||p.organizationName||(p.organizationId==='individual'?'No Organization / Individual':'Organization not specified')} · Day ${day.dayNo}`,p);
 for(const o of d.organizations||[]){if(o.name||o.phone||o.fullAddress)add('Organization',o.name,o.district,o);for(const p of o.contacts||[])add('Person',p.name,o.name,p);for(const type of ['mahasabha','sabha'] as const){if(o.gatheringType&&o.gatheringType.toLowerCase()!==type)continue;const v=o[type];if(v&&Object.values(v).some(Boolean))add('Gathering',v.venueName,`${type} · ${o.name}`,v);}if(Object.values(o.nightHalt||{}).some(Boolean))add('Night Halt',o.nightHalt.location||o.name,o.district,o.nightHalt);for(const r of o.rathJoinings||[])add('Rath Yatra',r.name,o.name,r);}
 for(const r of d.rathPlans||[]){add('Rath Yatra',r.name,(r.route||[]).filter(Boolean).join(' → '),r);for(const halt of r.stops||[])add('Major Halt',halt.location,r.name,halt);}
 for(const e of d.events||[])add('Event',e.name,e.location,e);
 for(const r of d.finalRoute||[])add('Proposed Route',`Day ${r.dayNo}`,`${r.from} → ${r.to}`,r);
 for(const a of d.strategicActions||[])add('Action',a.issue,a.priority||'',a);
 for(const [level,members] of Object.entries(d.committees||{}))for(const m of members||[])add('Committee',m.nameDesignation,level,m);
 return rows;
}
export const csvCell=(value:unknown)=>'"'+String(value??'').replace(/^[\s]*[=+@-]/,"'$&").replaceAll('"','""')+'"';
