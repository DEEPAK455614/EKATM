import type { ContactObservation, Festival, NightHalt, OrgVisit, RathPlan, StrategicAction, Venue, DistrictFeature, CommitteeMember, RouteDay } from './survey';

export type PlannedPerson={id:string;name:string;discussion:boolean;notes:string};
export type PlannedOrganization={id:string;name:string;discussion:boolean;notes:string};

export type StateProfileDraft={
  totalPopulation:string;
  totalArea:string;
  totalDistricts:string;
  municipalCorporationsMandals:string;
  municipalitiesTehsils:string;
  gramPanchayats:string;
};

export type FieldDayDraft={
  id:string;
  projectId:string;
  state:string;
  date:string;
  dayNo:number;
  teamLabel:string;
  journeyFrom:string;
  journeyTo:string;
  distance:string;
  persons:PlannedPerson[];
  organizations:PlannedOrganization[];
  otherCoveredPlaces:string;
  completedTasks:string;
  keyFindings:string;
  stateProfile:StateProfileDraft;
  districts:DistrictFeature[];
  organizationVisits:OrgVisit[];
  rathPlans:RathPlan[];
  festivals:Festival[];
  strategicActions:StrategicAction[];
  decisionsFollowup:string;
  committees:{national:CommitteeMember[];state:CommitteeMember[];district:CommitteeMember[]};
  finalRoute:RouteDay[];
  status:'draft'|'submitted';
  startedAt:string;
  submittedAt?:string;
  latitude?:number;
  longitude?:number;
  accuracyMeters?:number;
};

const id=()=>crypto.randomUUID();
export const emptyStateProfile=():StateProfileDraft=>({totalPopulation:'',totalArea:'',totalDistricts:'',municipalCorporationsMandals:'',municipalitiesTehsils:'',gramPanchayats:''});
export const fieldMakers={
  person:():PlannedPerson=>({id:id(),name:'',discussion:false,notes:''}),
  organization:():PlannedOrganization=>({id:id(),name:'',discussion:false,notes:''}),
  district:():DistrictFeature=>({id:id(),districtName:'',keyFeatures:''}),
  contact:():ContactObservation=>({id:id(),name:'',designation:'',phone:'',organizationRole:'',remarks:''}),
  venue:(type:'mahasabha'|'sabha'='mahasabha'):Venue=>({id:id(),type,name:'',address:'',expected:'',capacity:'',parkingLogistics:'',localSupport:'',remarks:''}),
  halt:():NightHalt=>({id:id(),location:'',reason:'',accommodationAvailability:'',distanceFromRoute:'',accommodationType:'',parking:'',capacity:'',food:'',facilities:'',other:''}),
  org:(state=''):OrgVisit=>({id:id(),name:'',categories:[],address:'',city:'',district:'',state,phone:'',head:'',websiteEmail:'',otherDetails:'',contacts:[],participation:[],mahaRath:{proposedLocation:'',expectedParticipation:'',venueDetails:'',parking:'',accommodation:'',localCoordination:'',otherLogistics:'',remarks:''},notInRoute:false,notInRouteReason:'',supportAreas:[],supportRemarks:'',venues:[],nightHalts:[]}),
  rath:():RathPlan=>({id:id(),name:'',from:'',to:'',joinPoint:'',originalPlan:'',expectedJoiningCount:'',proposedRoute:[],keyActivities:'',arrivalTime:'',arrivalLocation:'',vehicleCount:'',vehicleDetails:'',expectedNumber:'',stops:[],accommodationCapacity:'',parkingCapacity:'',otherFacilities:'',remarks:''}),
  festival:():Festival=>({id:id(),name:'',startDate:'',endDate:'',duration:'',location:'',expectedNumber:'',relevance:'',coordinationNotes:'',observations:''}),
  action:():StrategicAction=>({id:id(),issue:'',action:'',responsible:'',timeline:'',status:'open',remarks:''}),
  member:():CommitteeMember=>({id:id(),nameDesignation:'',institution:'',mobile:'',email:'',city:'',state:'',district:'',address:''}),
  routeDay:(dayNo=1):RouteDay=>({id:id(),dayNo,date:'',from:'',to:'',distance:'',intermediatePlaces:'',haltVenue:'',activities:'',remarks:''})
};

export function newFieldDay(projectId:string,state:string,dayNo=1):FieldDayDraft{
  const now=new Date();
  return {id:id(),projectId,state,date:now.toISOString().slice(0,10),dayNo,teamLabel:'',journeyFrom:'',journeyTo:'',distance:'',persons:[],organizations:[],otherCoveredPlaces:'',completedTasks:'',keyFindings:'',stateProfile:emptyStateProfile(),districts:[],organizationVisits:[],rathPlans:[],festivals:[],strategicActions:[],decisionsFollowup:'',committees:{national:[],state:[],district:[]},finalRoute:[],status:'draft',startedAt:now.toISOString()};
}

export function dayCompleteness(d:FieldDayDraft){
  const checks=[
    Boolean(d.date),Boolean(d.journeyFrom||d.journeyTo),Boolean(d.completedTasks),Boolean(d.keyFindings),
    d.persons.length>0||d.organizations.length>0,
    d.organizationVisits.length>0||d.rathPlans.length>0||d.festivals.length>0||d.strategicActions.length>0||d.districts.length>0||d.committees.national.length>0||d.committees.state.length>0||d.committees.district.length>0||d.finalRoute.length>0
  ];
  return Math.round(checks.filter(Boolean).length/checks.length*100);
}
