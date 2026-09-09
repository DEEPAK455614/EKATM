export const CATEGORIES = ['Educational','Religious','Social','Ashram','Temple','SHG','Other'] as const;
export const PARTICIPATION = ['Maha Rath Yatra','Rath Yatra','Night Halt','Welcome / Reception','Mahasabha','Sabha','Other'] as const;
export const SUPPORT_AREAS = ['Venue','Accommodation','Food / Prasad','Volunteer Support','Transportation','Parking','PR / Crowd Mobilization','Local Coordination','Publicity / Communication','Other'] as const;

export type TeamMember = { id:string; name:string; role:string; contact:string; area:string; remarks:string };
export type DistrictFeature = { id:string; districtName:string; keyFeatures:string };
export type DailyPerson = { id:string; name:string; discussion:boolean; notes:string };
export type DailyOrg = { id:string; name:string; discussion:boolean; notes:string };
export type DailyLog = { id:string; date:string; dayNo:number; from:string; to:string; distance:string; persons:DailyPerson[]; organizations:DailyOrg[]; otherPlaces:string; completedTasks:string; findings:string };
export type ContactObservation = { id:string; name:string; designation:string; phone:string; organizationRole:string; remarks:string };
export type Venue = { id:string; type:'mahasabha'|'sabha'; name:string; address:string; expected:string; capacity:string; parkingLogistics:string; localSupport:string; remarks:string };
export type NightHalt = { id:string; location:string; reason:string; accommodationAvailability:string; distanceFromRoute:string; accommodationType:string; parking:string; capacity:string; food:string; facilities:string; other:string };
export type OrgVisit = {
  id:string; organizationId?:string; name:string; categories:string[]; address:string; city:string; district:string; state:string; phone:string; head:string; websiteEmail:string; otherDetails:string;
  contacts:ContactObservation[]; participation:string[]; mahaRath:{ proposedLocation:string; expectedParticipation:string; venueDetails:string; parking:string; accommodation:string; localCoordination:string; otherLogistics:string; remarks:string };
  notInRoute:boolean; notInRouteReason:string; supportAreas:string[]; supportRemarks:string; venues:Venue[]; nightHalts:NightHalt[];
};
export type RathStop = { id:string; location:string; arrivalTime:string; haltDuration:string; facilities:string; remarks:string };
export type RathPlan = { id:string; name:string; from:string; to:string; joinPoint:string; originalPlan:string; expectedJoiningCount:string; proposedRoute:string[]; keyActivities:string; arrivalTime:string; arrivalLocation:string; vehicleCount:string; vehicleDetails:string; expectedNumber:string; stops:RathStop[]; accommodationCapacity:string; parkingCapacity:string; otherFacilities:string; remarks:string };
export type Festival = { id:string; name:string; startDate:string; endDate:string; duration:string; location:string; expectedNumber:string; relevance:string; coordinationNotes:string; observations:string };
export type StrategicAction = { id:string; issue:string; action:string; responsible:string; timeline:string; status:string; remarks:string };
export type CommitteeMember = { id:string; nameDesignation:string; institution:string; mobile:string; email:string; city:string; state:string; district:string; address:string };
export type RouteDay = { id:string; dayNo:number; date:string; from:string; to:string; distance:string; intermediatePlaces:string; haltVenue:string; activities:string; remarks:string };

export type SurveyDraft = {
  id:string; projectId:string; revision:number; status:string; state:string; surveyStart:string; surveyEnd:string; coordinatorName:string;
  team:TeamMember[];
  stateProfile:{ totalPopulation:string; totalArea:string; totalDistricts:string; municipalCorporationsMandals:string; municipalitiesTehsils:string; gramPanchayats:string };
  districts:DistrictFeature[];
  dailyLogs:DailyLog[];
  organizationVisits:OrgVisit[];
  rathPlans:RathPlan[];
  festivals:Festival[];
  strategicActions:StrategicAction[];
  decisionsFollowup:string;
  committees:{ national:CommitteeMember[]; state:CommitteeMember[]; district:CommitteeMember[] };
  finalRoute:RouteDay[];
  lastSavedAt?:string;
};

const id=()=>crypto.randomUUID();
export function blankSurvey():SurveyDraft {
  const projectId=id();
  return { id:projectId, projectId, revision:1, status:'draft', state:'', surveyStart:'', surveyEnd:'', coordinatorName:'', team:[], stateProfile:{totalPopulation:'',totalArea:'',totalDistricts:'',municipalCorporationsMandals:'',municipalitiesTehsils:'',gramPanchayats:''}, districts:[], dailyLogs:[], organizationVisits:[], rathPlans:[], festivals:[], strategicActions:[], decisionsFollowup:'', committees:{national:[],state:[],district:[]}, finalRoute:[] };
}

export const makers = {
  team:():TeamMember=>({id:id(),name:'',role:'',contact:'',area:'',remarks:''}),
  district:():DistrictFeature=>({id:id(),districtName:'',keyFeatures:''}),
  daily:():DailyLog=>({id:id(),date:'',dayNo:1,from:'',to:'',distance:'',persons:[],organizations:[],otherPlaces:'',completedTasks:'',findings:''}),
  person:():DailyPerson=>({id:id(),name:'',discussion:false,notes:''}),
  dailyOrg:():DailyOrg=>({id:id(),name:'',discussion:false,notes:''}),
  contact:():ContactObservation=>({id:id(),name:'',designation:'',phone:'',organizationRole:'',remarks:''}),
  venue:(type:'mahasabha'|'sabha'='mahasabha'):Venue=>({id:id(),type,name:'',address:'',expected:'',capacity:'',parkingLogistics:'',localSupport:'',remarks:''}),
  halt:():NightHalt=>({id:id(),location:'',reason:'',accommodationAvailability:'',distanceFromRoute:'',accommodationType:'',parking:'',capacity:'',food:'',facilities:'',other:''}),
  org:():OrgVisit=>({id:id(),name:'',categories:[],address:'',city:'',district:'',state:'',phone:'',head:'',websiteEmail:'',otherDetails:'',contacts:[],participation:[],mahaRath:{proposedLocation:'',expectedParticipation:'',venueDetails:'',parking:'',accommodation:'',localCoordination:'',otherLogistics:'',remarks:''},notInRoute:false,notInRouteReason:'',supportAreas:[],supportRemarks:'',venues:[],nightHalts:[]}),
  stop:():RathStop=>({id:id(),location:'',arrivalTime:'',haltDuration:'',facilities:'',remarks:''}),
  rath:():RathPlan=>({id:id(),name:'',from:'',to:'',joinPoint:'',originalPlan:'',expectedJoiningCount:'',proposedRoute:[],keyActivities:'',arrivalTime:'',arrivalLocation:'',vehicleCount:'',vehicleDetails:'',expectedNumber:'',stops:[],accommodationCapacity:'',parkingCapacity:'',otherFacilities:'',remarks:''}),
  festival:():Festival=>({id:id(),name:'',startDate:'',endDate:'',duration:'',location:'',expectedNumber:'',relevance:'',coordinationNotes:'',observations:''}),
  action:():StrategicAction=>({id:id(),issue:'',action:'',responsible:'',timeline:'',status:'open',remarks:''}),
  member:():CommitteeMember=>({id:id(),nameDesignation:'',institution:'',mobile:'',email:'',city:'',state:'',district:'',address:''}),
  routeDay:(dayNo=1):RouteDay=>({id:id(),dayNo,date:'',from:'',to:'',distance:'',intermediatePlaces:'',haltVenue:'',activities:'',remarks:''})
};

export function completeness(d:SurveyDraft){ const checks=[Boolean(d.state),d.team.length>0,d.districts.length>0,d.dailyLogs.length>0,d.organizationVisits.length>0,d.rathPlans.length>0,d.festivals.length>0,d.strategicActions.length>0,d.finalRoute.length>0]; return Math.round(checks.filter(Boolean).length/checks.length*100); }
