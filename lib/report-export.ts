'use client';
import type {FieldDayDraft} from './field';
import type {SurveyDraft,TeamMember} from './survey';

const safe=(v:any)=>String(v??'').trim()||'—';
const clean=(v:string)=>v.replace(/[^a-zA-Z0-9_-]+/g,'_');

async function makeDoc(title:string,subtitle:string){
  const {jsPDF}=await import('jspdf');
  const doc=new jsPDF({unit:'pt',format:'a4'});
  const pageW=595.28,pageH=841.89,left=42,right=42,contentW=pageW-left-right;
  let y=42;
  const header=()=>{
    doc.setFillColor(147,67,20);doc.rect(0,0,pageW,8,'F');
    doc.setFont('helvetica','bold');doc.setTextColor(118,52,14);doc.setFontSize(9);doc.text('EKATMA YATRA · COMPREHENSIVE STATE SURVEY',left,28);
    doc.setTextColor(25,31,38);
  };
  const newPage=()=>{doc.addPage();y=42;header()};
  const ensure=(need=32)=>{if(y+need>pageH-46)newPage()};
  const text=(value:string,size=10,bold=false,indent=0)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(31,38,46);const parts=doc.splitTextToSize(value||'—',contentW-indent);ensure(parts.length*(size+4)+8);doc.text(parts,left+indent,y);y+=parts.length*(size+4)+5;};
  const section=(name:string)=>{ensure(30);y+=5;doc.setFillColor(251,241,230);doc.roundedRect(left,y-13,contentW,24,5,5,'F');doc.setTextColor(139,60,12);doc.setFont('helvetica','bold');doc.setFontSize(11);doc.text(name,left+10,y+2);y+=20;doc.setTextColor(31,38,46)};
  const rule=()=>{ensure(10);doc.setDrawColor(230,215,199);doc.line(left,y, pageW-right,y);y+=9};
  header();
  doc.setFont('helvetica','bold');doc.setFontSize(20);doc.setTextColor(105,46,12);doc.text(title,left,y+15);y+=26;
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(104,94,83);doc.text(doc.splitTextToSize(subtitle,contentW),left,y);y+=24;
  rule();
  return {doc,text,section,rule,getY:()=>y,setY:(v:number)=>{y=v},ensure};
}

export async function exportFieldDayPdf(day:FieldDayDraft,team:TeamMember[]=[]){
  const x=await makeDoc(`Daily Survey Report · Day ${day.dayNo}`,`${day.state} · ${day.date} · Automatically generated from the surveyor's submitted data.`);
  const {doc,text,section,rule}=x;
  section('01 · FIELD DEPLOYMENT');
  text(`State: ${safe(day.state)}   |   Survey Day: ${day.dayNo}   |   Date: ${safe(day.date)}`);
  if(team.length)team.forEach((m,i)=>text(`${i+1}. ${safe(m.name)} · ${safe(m.role)} · ${safe(m.contact)} · Area: ${safe(m.area)} · ${safe(m.remarks)}`,9));

  section('02 · GEOGRAPHICAL & ADMINISTRATIVE PROFILE — DATA UPDATED TODAY');
  const sp=day.stateProfile;
  text(`Total Population: ${safe(sp.totalPopulation)} | Total Area (sq km): ${safe(sp.totalArea)} | Total Districts: ${safe(sp.totalDistricts)}`);
  text(`Municipal Corp./Mandals: ${safe(sp.municipalCorporationsMandals)} | Municipalities/Tehsils: ${safe(sp.municipalitiesTehsils)} | Gram Panchayats: ${safe(sp.gramPanchayats)}`);
  day.districts.forEach((d,i)=>text(`${i+1}. ${safe(d.districtName)} — ${safe(d.keyFeatures)}`,9));

  section('03 · DAILY ACTIVITY LOG');
  text(`Full Day Journey: ${safe(day.journeyFrom)} → ${safe(day.journeyTo)}   |   Total Distance: ${safe(day.distance)} km`,10,true);
  text('Persons to Discuss With',10,true);day.persons.forEach((p,i)=>text(`${i+1}. ${safe(p.name)} · Discussion: ${p.discussion?'Completed / Yes':'Planned / No'} · ${safe(p.notes)}`,9, false,8));
  text('Organizations to Discuss With',10,true);day.organizations.forEach((o,i)=>text(`${i+1}. ${safe(o.name)} · Discussion: ${o.discussion?'Completed / Yes':'Planned / No'} · ${safe(o.notes)}`,9,false,8));
  text(`Other Covered Places: ${safe(day.otherCoveredPlaces)}`);text(`Completed Tasks / Activities: ${safe(day.completedTasks)}`);text(`Key Survey Findings: ${safe(day.keyFindings)}`);

  section('04 · ORGANIZATION & CONTACT DETAILS / PARTICIPATION / LOGISTICS');
  day.organizationVisits.forEach((o,oi)=>{
    text(`${oi+1}. ${safe(o.name)} · ${o.categories.length?o.categories.join(', '):'Category —'}`,11,true);
    text(`${safe(o.address)} · ${safe(o.city)} · ${safe(o.district)} · ${safe(o.state)} · Phone ${safe(o.phone)}`,9);
    text(`Head/Representative: ${safe(o.head)} · Website/Email: ${safe(o.websiteEmail)}`,9);
    text(`Other Relevant Details: ${safe(o.otherDetails)}`,9);
    o.contacts.forEach((c,i)=>text(`Contact ${i+1}: ${safe(c.name)} · ${safe(c.designation)} · ${safe(c.phone)} · ${safe(c.organizationRole)} · ${safe(c.remarks)}`,9,false,8));
    text(`Proposed Role / Participation: ${o.participation.length?o.participation.join(', '):'—'}`,9);
    if(o.participation.includes('Maha Rath Yatra')){
      const m=o.mahaRath;text(`Maha Rath — Proposed Location: ${safe(m.proposedLocation)} · Expected Participation: ${safe(m.expectedParticipation)}`,9);
      text(`Venue: ${safe(m.venueDetails)} · Parking: ${safe(m.parking)} · Accommodation: ${safe(m.accommodation)} · Local Coordination: ${safe(m.localCoordination)} · Other Logistics: ${safe(m.otherLogistics)} · Remarks: ${safe(m.remarks)}`,9);
    }
    if(o.notInRoute)text(`IF NOT IN ROUTE — Reason / Relevance: ${safe(o.notInRouteReason)}`,9,true);
    text(`Potential Support Areas: ${o.supportAreas.length?o.supportAreas.join(', '):'—'} · ${safe(o.supportRemarks)}`,9);
    o.venues.forEach((v,i)=>text(`${v.type==='mahasabha'?'Mahasabha':'Sabha'} ${i+1}: ${safe(v.name)} · ${safe(v.address)} · Expected ${safe(v.expected)} · Capacity ${safe(v.capacity)} · Parking/Logistics ${safe(v.parkingLogistics)} · Local Support ${safe(v.localSupport)} · ${safe(v.remarks)}`,9,false,8));
    o.nightHalts.forEach((h,i)=>text(`Night Halt ${i+1}: ${safe(h.location)} · Why: ${safe(h.reason)} · Accommodation ${safe(h.accommodationAvailability)} (${safe(h.accommodationType)}) · Distance from route ${safe(h.distanceFromRoute)} · Parking ${safe(h.parking)} · Capacity ${safe(h.capacity)} · Food ${safe(h.food)} · Facilities ${safe(h.facilities)} · ${safe(h.other)}`,9,false,8));
    rule();
  });

  section('05 · RATH YATRA — PROPOSED PLAN');
  day.rathPlans.forEach((r,i)=>{text(`${i+1}. ${safe(r.name)} · Route: ${r.proposedRoute.length?r.proposedRoute.join(' → '):`${safe(r.from)} → ${safe(r.to)}`}`,10,true);text(`Join Maha Rath: ${safe(r.joinPoint)} · Expected joining here: ${safe(r.expectedJoiningCount)} · Original Plan/Remarks: ${safe(r.originalPlan)}`,9);text(`Key Activities: ${safe(r.keyActivities)} · Arrival: ${safe(r.arrivalTime)} at ${safe(r.arrivalLocation)} · Vehicles ${safe(r.vehicleCount)} · ${safe(r.vehicleDetails)} · Expected Number ${safe(r.expectedNumber)}`,9);r.stops.forEach((st,j)=>text(`Halt ${j+1}: ${safe(st.location)} · ${safe(st.arrivalTime)} · Duration ${safe(st.haltDuration)} · Facilities ${safe(st.facilities)} · ${safe(st.remarks)}`,9,false,8));text(`Major halt capacities — Accommodation ${safe(r.accommodationCapacity)} · Parking ${safe(r.parkingCapacity)} · Other Facilities ${safe(r.otherFacilities)} · Remarks ${safe(r.remarks)}`,9);});

  section('06 · EVENTS & FESTIVALS');
  day.festivals.forEach((e,i)=>text(`${i+1}. ${safe(e.name)} · ${safe(e.startDate)}${e.endDate?` to ${e.endDate}`:''} · ${safe(e.duration)} · ${safe(e.location)} · Expected ${safe(e.expectedNumber)} · Relevance ${safe(e.relevance)} · Coordination ${safe(e.coordinationNotes)} · Observations ${safe(e.observations)}`,9));

  section('07 · STRATEGIC PLANNING & ACTION');
  day.strategicActions.forEach((a,i)=>text(`${i+1}. ${safe(a.issue)} → ${safe(a.action)} · Responsible ${safe(a.responsible)} · Timeline ${safe(a.timeline)} · Status ${safe(a.status)} · ${safe(a.remarks)}`,9));
  text(`Important Decisions / Follow-up: ${safe(day.decisionsFollowup)}`);

  section('08 · PROPOSED COMMITTEES');
  (['national','state','district'] as const).forEach(level=>{text(`${level.toUpperCase()} COMMITTEE`,10,true);day.committees[level].forEach((m,i)=>text(`${i+1}. ${safe(m.nameDesignation)} · ${safe(m.institution)} · ${safe(m.mobile)} · ${safe(m.email)} · ${safe(m.city)} · ${safe(m.district)} · ${safe(m.state)} · ${safe(m.address)}`,9,false,8));});

  section('09 · PROPOSED ROUTE PLAN — DATA UPDATED TODAY');
  day.finalRoute.slice().sort((a,b)=>a.dayNo-b.dayNo).forEach(r=>text(`Day ${r.dayNo} · ${safe(r.date)} · ${safe(r.from)} → ${safe(r.to)} · ${safe(r.distance)} km · Via ${safe(r.intermediatePlaces)} · Halt/Venue ${safe(r.haltVenue)} · Activities ${safe(r.activities)} · ${safe(r.remarks)}`,9));

  doc.save(`Ekatma_Daily_Survey_${clean(day.state)}_Day_${day.dayNo}_${clean(day.date)}.pdf`);
}

export async function exportMasterPdf(master:SurveyDraft){
  const x=await makeDoc('Comprehensive State Survey Report',`${master.state} · Automatically consolidated from ${master.dailyLogs.length} daily survey report${master.dailyLogs.length===1?'':'s'} and frozen at review time.`);
  const {doc,text,section,rule}=x;
  section('01 · STATE SURVEY TEAM');
  text(`State: ${safe(master.state)} · Survey Period: ${safe(master.surveyStart)} → ${safe(master.surveyEnd)} · Team Coordinator: ${safe(master.coordinatorName)}`);
  master.team.forEach((m,i)=>text(`${i+1}. ${safe(m.name)} · ${safe(m.role)} · ${safe(m.contact)} · Allocated Area ${safe(m.area)} · ${safe(m.remarks)}`,9));
  section('02 · STATE AT A GLANCE');
  const sp=master.stateProfile;text(`Total Population ${safe(sp.totalPopulation)} · Total Area ${safe(sp.totalArea)} sq km · Total Districts ${safe(sp.totalDistricts)} · Municipal Corp./Mandals ${safe(sp.municipalCorporationsMandals)} · Municipalities/Tehsils ${safe(sp.municipalitiesTehsils)} · Gram Panchayats ${safe(sp.gramPanchayats)}`);
  master.districts.forEach((d,i)=>text(`${i+1}. ${safe(d.districtName)} — ${safe(d.keyFeatures)}`,9));
  section('03 · DAILY ACTIVITY LOG');
  master.dailyLogs.slice().sort((a,b)=>a.dayNo-b.dayNo).forEach(d=>{text(`Day ${d.dayNo} · ${safe(d.date)} · ${safe(d.from)} → ${safe(d.to)} · ${safe(d.distance)} km`,10,true);d.persons.forEach((p,i)=>text(`Person ${i+1}: ${safe(p.name)} · Discussion ${p.discussion?'Yes':'No'} · ${safe(p.notes)}`,9,false,8));d.organizations.forEach((o,i)=>text(`Organization ${i+1}: ${safe(o.name)} · Discussion ${o.discussion?'Yes':'No'} · ${safe(o.notes)}`,9,false,8));text(`Other Covered Places: ${safe(d.otherPlaces)} · Completed Tasks/Activities: ${safe(d.completedTasks)} · Key Findings: ${safe(d.findings)}`,9);rule();});
  section('04 · ORGANIZATION & CONTACT DETAILS / PARTICIPATION / VENUE & LOGISTICS / SUPPORT');
  master.organizationVisits.forEach((o,i)=>{text(`${i+1}. ${safe(o.name)} · ${o.categories.join(', ')||'—'} · ${safe(o.address)} · ${safe(o.city)} · ${safe(o.district)} · ${safe(o.state)}`,10,true);text(`Phone ${safe(o.phone)} · Head/Representative ${safe(o.head)} · Website/Email ${safe(o.websiteEmail)} · ${safe(o.otherDetails)}`,9);o.contacts.forEach((c,j)=>text(`Contact ${j+1}: ${safe(c.name)} · ${safe(c.designation)} · ${safe(c.phone)} · ${safe(c.organizationRole)} · ${safe(c.remarks)}`,9,false,8));text(`Participation: ${o.participation.join(', ')||'—'} · Support: ${o.supportAreas.join(', ')||'—'} · ${safe(o.supportRemarks)}`,9);if(o.participation.includes('Maha Rath Yatra')){const m=o.mahaRath;text(`Maha Rath: ${safe(m.proposedLocation)} · Expected ${safe(m.expectedParticipation)} · Venue ${safe(m.venueDetails)} · Parking ${safe(m.parking)} · Accommodation ${safe(m.accommodation)} · Coordination ${safe(m.localCoordination)} · Logistics ${safe(m.otherLogistics)} · ${safe(m.remarks)}`,9);}if(o.notInRoute)text(`IF NOT IN ROUTE: ${safe(o.notInRouteReason)}`,9,true);o.venues.forEach(v=>text(`${v.type==='mahasabha'?'Mahasabha':'Sabha'}: ${safe(v.name)} · ${safe(v.address)} · Expected ${safe(v.expected)} · Capacity ${safe(v.capacity)} · Parking/Logistics ${safe(v.parkingLogistics)} · Local Support ${safe(v.localSupport)} · ${safe(v.remarks)}`,9,false,8));o.nightHalts.forEach(h=>text(`Night Halt: ${safe(h.location)} · Why ${safe(h.reason)} · Accommodation ${safe(h.accommodationAvailability)} / ${safe(h.accommodationType)} · Distance ${safe(h.distanceFromRoute)} · Parking ${safe(h.parking)} · Capacity ${safe(h.capacity)} · Food ${safe(h.food)} · Facilities ${safe(h.facilities)} · ${safe(h.other)}`,9,false,8));rule();});
  section('05 · RATH YATRA PROPOSED PLAN');
  master.rathPlans.forEach((r,i)=>{text(`${i+1}. ${safe(r.name)} · ${r.proposedRoute.join(' → ')||`${safe(r.from)} → ${safe(r.to)}`}`,10,true);text(`Where it joins Maha Rath ${safe(r.joinPoint)} · Expected joining ${safe(r.expectedJoiningCount)} · Original plan ${safe(r.originalPlan)} · Activities ${safe(r.keyActivities)} · Arrival ${safe(r.arrivalTime)} ${safe(r.arrivalLocation)} · Vehicles ${safe(r.vehicleCount)} ${safe(r.vehicleDetails)} · Expected ${safe(r.expectedNumber)}`,9);r.stops.forEach((st,j)=>text(`Halt ${j+1}: ${safe(st.location)} · ${safe(st.arrivalTime)} · ${safe(st.haltDuration)} · ${safe(st.facilities)} · ${safe(st.remarks)}`,9,false,8));text(`Accommodation Capacity ${safe(r.accommodationCapacity)} · Parking Capacity ${safe(r.parkingCapacity)} · Other Facilities ${safe(r.otherFacilities)} · ${safe(r.remarks)}`,9);});
  section('06 · EVENTS & FESTIVALS');master.festivals.forEach((e,i)=>text(`${i+1}. ${safe(e.name)} · ${safe(e.startDate)}${e.endDate?` to ${e.endDate}`:''} · ${safe(e.duration)} · ${safe(e.location)} · Expected ${safe(e.expectedNumber)} · Relevance ${safe(e.relevance)} · Coordination ${safe(e.coordinationNotes)} · Observations ${safe(e.observations)}`,9));
  section('07 · STRATEGIC PLANNING & ACTION');master.strategicActions.forEach((a,i)=>text(`${i+1}. ${safe(a.issue)} → ${safe(a.action)} · Responsible ${safe(a.responsible)} · Timeline ${safe(a.timeline)} · Status ${safe(a.status)} · ${safe(a.remarks)}`,9));text(`Important Decisions / Follow-up: ${safe(master.decisionsFollowup)}`);
  section('08 · PROPOSED COMMITTEES');(['national','state','district'] as const).forEach(level=>{text(`${level.toUpperCase()} COMMITTEE`,10,true);master.committees[level].forEach((m,i)=>text(`${i+1}. ${safe(m.nameDesignation)} · ${safe(m.institution)} · ${safe(m.mobile)} · ${safe(m.email)} · ${safe(m.city)} · ${safe(m.district)} · ${safe(m.state)} · ${safe(m.address)}`,9,false,8));});
  section('09 · FINAL PROPOSED ROUTE PLAN');master.finalRoute.slice().sort((a,b)=>a.dayNo-b.dayNo).forEach(r=>text(`Day ${r.dayNo} · ${safe(r.date)} · ${safe(r.from)} → ${safe(r.to)} · ${safe(r.distance)} km · Via ${safe(r.intermediatePlaces)} · Halt/Venue ${safe(r.haltVenue)} · Activities ${safe(r.activities)} · ${safe(r.remarks)}`,9));
  doc.save(`Ekatma_Master_Survey_${clean(master.state)}.pdf`);
}
