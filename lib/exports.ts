'use client';
import type { SurveyDraft } from './survey';

export async function exportSurveyXlsx(d:SurveyDraft){
  const XLSX=await import('xlsx');
  const wb=XLSX.utils.book_new();
  const add=(name:string,rows:any[])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{}]),name.slice(0,31));
  add('Survey',[{ProjectID:d.projectId,State:d.state,SurveyStart:d.surveyStart,SurveyEnd:d.surveyEnd,Status:d.status,Revision:d.revision}]);
  add('Team',d.team.map(x=>({ID:x.id,Name:x.name,RoleResponsibility:x.role,Contact:x.contact,AllocatedArea:x.area,Remarks:x.remarks})));
  add('State Profile',[{...d.stateProfile}]);
  add('District Features',d.districts.map(x=>({ID:x.id,District:x.districtName,KeyFeatures:x.keyFeatures})));
  add('Daily Logs',d.dailyLogs.map(x=>({ID:x.id,Date:x.date,DayNo:x.dayNo,From:x.from,To:x.to,DistanceKm:x.distance,OtherCoveredPlaces:x.otherPlaces,CompletedTasks:x.completedTasks,Findings:x.findings})));
  add('Planned Persons',d.dailyLogs.flatMap(l=>l.persons.map(x=>({DailyLogID:l.id,Date:l.date,Person:x.name,DiscussionCompleted:x.discussion,Notes:x.notes}))));
  add('Planned Organisations',d.dailyLogs.flatMap(l=>l.organizations.map(x=>({DailyLogID:l.id,Date:l.date,Organization:x.name,DiscussionCompleted:x.discussion,Notes:x.notes}))));
  add('Organization Visits',d.organizationVisits.map(x=>({ID:x.id,Name:x.name,Categories:x.categories.join('; '),Address:x.address,City:x.city,District:x.district,State:x.state,Phone:x.phone,HeadRepresentative:x.head,WebsiteEmail:x.websiteEmail,OtherDetails:x.otherDetails,Participation:x.participation.join('; '),NotInRoute:x.notInRoute,NotInRouteReason:x.notInRouteReason,SupportAreas:x.supportAreas.join('; '),SupportRemarks:x.supportRemarks})));
  add('Contacts',d.organizationVisits.flatMap(o=>o.contacts.map(c=>({OrganizationVisitID:o.id,Organization:o.name,ID:c.id,Name:c.name,Designation:c.designation,ContactNumber:c.phone,OrganizationRole:c.organizationRole,Remarks:c.remarks}))));
  add('Venues',d.organizationVisits.flatMap(o=>o.venues.map(v=>({Organization:o.name,ID:v.id,Type:v.type,VenueName:v.name,Address:v.address,ExpectedNumber:v.expected,Capacity:v.capacity,ParkingLogistics:v.parkingLogistics,LocalSupport:v.localSupport,Remarks:v.remarks}))));
  add('Night Halts',d.organizationVisits.flatMap(o=>o.nightHalts.map(h=>({Organization:o.name,ID:h.id,Location:h.location,Reason:h.reason,AccommodationAvailability:h.accommodationAvailability,DistanceFromRoute:h.distanceFromRoute,AccommodationType:h.accommodationType,Parking:h.parking,Capacity:h.capacity,Food:h.food,Facilities:h.facilities,Other:h.other}))));
  add('Rath Yatras',d.rathPlans.map(r=>({ID:r.id,Name:r.name,From:r.from,To:r.to,JoinPoint:r.joinPoint,OriginalPlan:r.originalPlan,ExpectedJoiningCount:r.expectedJoiningCount,ProposedRoute:r.proposedRoute.join(' → '),KeyActivities:r.keyActivities,ArrivalTime:r.arrivalTime,ArrivalLocation:r.arrivalLocation,VehicleCount:r.vehicleCount,VehicleDetails:r.vehicleDetails,ExpectedNumber:r.expectedNumber,AccommodationCapacity:r.accommodationCapacity,ParkingCapacity:r.parkingCapacity,OtherFacilities:r.otherFacilities,Remarks:r.remarks})));
  add('Rath Halts',d.rathPlans.flatMap(r=>r.stops.map((s,i)=>({RathID:r.id,Rath:r.name,Sequence:i+1,Location:s.location,ArrivalTime:s.arrivalTime,HaltDurationMinutes:s.haltDuration,Facilities:s.facilities,Remarks:s.remarks}))));
  add('Events Festivals',d.festivals.map(x=>({ID:x.id,EventFestival:x.name,StartDate:x.startDate,EndDate:x.endDate,Duration:x.duration,Location:x.location,ExpectedNumber:x.expectedNumber,Relevance:x.relevance,CoordinationNotes:x.coordinationNotes,Observations:x.observations})));
  add('Strategic Actions',d.strategicActions.map(x=>({ID:x.id,PriorityKeyIssue:x.issue,ProposedAction:x.action,Responsible:x.responsible,Timeline:x.timeline,Status:x.status,Remarks:x.remarks})));
  add('Committees',(['national','state','district'] as const).flatMap(level=>d.committees[level].map(m=>({Level:level,ID:m.id,NameDesignation:m.nameDesignation,Institution:m.institution,Mobile:m.mobile,Email:m.email,City:m.city,State:m.state,District:m.district,Address:m.address}))));
  add('Final Route',d.finalRoute.map(x=>({ID:x.id,DayNo:x.dayNo,Date:x.date,From:x.from,To:x.to,DistanceKm:x.distance,IntermediatePlaces:x.intermediatePlaces,HaltVenue:x.haltVenue,Activities:x.activities,Remarks:x.remarks})));
  XLSX.writeFile(wb,`Ekatma_Yatra_Survey_${(d.state||'Draft').replace(/\W+/g,'_')}.xlsx`);
}

export async function exportSurveyPdf(d:SurveyDraft){
  const {jsPDF}=await import('jspdf');
  const doc=new jsPDF({unit:'pt',format:'a4'}); let y=54; const left=44,max=500;
  const line=(text:string,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const parts=doc.splitTextToSize(text||'—',max);if(y+parts.length*(size+4)>790){doc.addPage();y=54;}doc.text(parts,left,y);y+=parts.length*(size+4)+5;};
  line('EKATMA YATRA — COMPREHENSIVE SURVEY REPORT',16,true);line(`${d.state||'State not entered'}  |  ${d.surveyStart||'—'} to ${d.surveyEnd||'—'}  |  ${d.status}`,10);y+=8;
  line('State Survey Team',13,true);d.team.forEach((x,i)=>line(`${i+1}. ${x.name} — ${x.role}; ${x.contact}; Area: ${x.area}; ${x.remarks}`));
  line('State at a Glance',13,true);line(`Population: ${d.stateProfile.totalPopulation||'—'} | Area sq km: ${d.stateProfile.totalArea||'—'} | Districts: ${d.stateProfile.totalDistricts||'—'} | Municipal Corp./Mandals: ${d.stateProfile.municipalCorporationsMandals||'—'} | Municipalities/Tehsils: ${d.stateProfile.municipalitiesTehsils||'—'} | Gram Panchayats: ${d.stateProfile.gramPanchayats||'—'}`);
  d.districts.forEach(x=>line(`${x.districtName}: ${x.keyFeatures}`));
  line('Daily Activity Log',13,true);d.dailyLogs.forEach(x=>line(`Day ${x.dayNo} • ${x.date} • ${x.from} → ${x.to} • ${x.distance} km\nCovered: ${x.otherPlaces}\nCompleted: ${x.completedTasks}\nFindings: ${x.findings}`));
  line('Organizations & Institutional Participation',13,true);d.organizationVisits.forEach(o=>line(`${o.name} • ${o.categories.join(', ')} • ${o.address}, ${o.city}, ${o.district}, ${o.state}\nHead: ${o.head} • ${o.phone} • ${o.websiteEmail}\nParticipation: ${o.participation.join(', ')}\nSupport: ${o.supportAreas.join(', ')}\n${o.notInRoute?`Not in route — ${o.notInRouteReason}`:''}\n${o.otherDetails}`));
  line('Rath Yatra Plans',13,true);d.rathPlans.forEach(r=>line(`${r.name}: ${r.proposedRoute.join(' → ')}\nArrival: ${r.arrivalTime} at ${r.arrivalLocation}; vehicles ${r.vehicleCount} ${r.vehicleDetails}; expected ${r.expectedNumber}\nActivities: ${r.keyActivities}\nRemarks: ${r.remarks}`));
  line('Events & Festivals',13,true);d.festivals.forEach(e=>line(`${e.name} • ${e.startDate}${e.endDate?` to ${e.endDate}`:''} • ${e.location} • Expected ${e.expectedNumber}\nRelevance: ${e.relevance}\nCoordination: ${e.coordinationNotes}\nObservations: ${e.observations}`));
  line('Strategic Planning & Action',13,true);d.strategicActions.forEach(a=>line(`${a.issue} → ${a.action} | Responsible: ${a.responsible} | ${a.timeline} | ${a.status} | ${a.remarks}`));line(`Important Decisions / Follow-up: ${d.decisionsFollowup}`);
  line('Proposed Committees',13,true);(['national','state','district'] as const).forEach(level=>{line(level.toUpperCase(),11,true);d.committees[level].forEach(m=>line(`${m.nameDesignation} • ${m.institution} • ${m.mobile} ${m.email} • ${m.city} ${m.district} ${m.state} ${m.address}`));});
  line('Final Proposed Route Plan',13,true);d.finalRoute.sort((a,b)=>a.dayNo-b.dayNo).forEach(r=>line(`Day ${r.dayNo} ${r.date}: ${r.from} → ${r.to} (${r.distance} km) | Via: ${r.intermediatePlaces} | Halt: ${r.haltVenue} | Activities: ${r.activities} | ${r.remarks}`));
  doc.save(`Ekatma_Yatra_Survey_${(d.state||'Draft').replace(/\W+/g,'_')}.pdf`);
}
