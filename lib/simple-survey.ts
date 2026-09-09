export type TeamMember={id:string;name:string;role:string;contact:string;area:string;remarks:string};
export type DistrictFeature={id:string;districtName:string;keyFeatures:string};
export type DailyPerson={id:string;name:string;discussion:boolean};
export type DailyOrg={id:string;name:string;discussion:boolean};
export type DailyLog={id:string;date:string;dayNo:number;from:string;to:string;distance:string;persons:DailyPerson[];organizations:DailyOrg[];otherPlaces:string;completedTasks:string;findings:string};
export type ContactPerson={id:string;name:string;designation:string;contact:string;organizationRole:string;remarks:string};
export type RathJoining={id:string;name:string;from:string;to:string;joinPoint:string;originalPlanRemarks:string};
export type VenueBlock={venueName:string;address:string;expectedNumber:string;capacity:string;parkingLogistics:string;localSupport:string;remarks:string};
export type NightHalt={reason:string;accommodationAvailability:string;distanceFromRoute:string;accommodationType:string;parking:string;capacity:string;foodArrangements:string;availableFacilities:string;otherConsiderations:string};
export type OrganizationRecord={id:string;name:string;categories:string[];otherCategory:string;fullAddress:string;city:string;district:string;state:string;phone:string;headRepresentative:string;websiteEmail:string;otherDetails:string;contacts:ContactPerson[];participation:string[];mahaRath:{proposedLocation:string;expectedParticipation:string;venueDetails:string;parkingAvailability:string;accommodation:string;localCoordination:string;otherLogistics:string;remarks:string};expectedJoiningCount:string;rathJoinings:RathJoining[];mahasabha:VenueBlock;sabha:VenueBlock;nightHalt:NightHalt;notInRoute:boolean;notInRouteReason:string;supportAreas:string[];otherSupport:string;supportRemarks:string};
export type RathStop={id:string;location:string;arrivalTime:string;haltDuration:string;facilities:string;remarks:string};
export type RathPlan={id:string;name:string;route:string[];keyActivities:string;arrivalTime:string;arrivalLocation:string;vehicleCount:string;vehicleDetails:string;expectedNumber:string;stops:RathStop[];accommodationCapacity:string;parkingCapacity:string;otherFacilities:string;remarks:string};
export type Festival={id:string;name:string;dateDuration:string;location:string;expectedNumber:string;relevance:string;coordinationNotes:string};
export type StrategicAction={id:string;issue:string;action:string;responsible:string;timeline:string;status:string;remarks:string};
export type CommitteeMember={id:string;nameDesignation:string;institution:string;mobileEmail:string;cityState:string;cityDistrict:string;districtAddress:string};
export type RouteDay={id:string;dayNo:number;date:string;from:string;to:string;distance:string;intermediatePlaces:string;haltVenue:string;activities:string;remarks:string};

export type SimpleSurveyData={
  meta:{state:string;surveyPeriod:string;teamCoordinator:string;date:string;team:TeamMember[]};
  stateProfile:{totalPopulation:string;totalArea:string;totalDistricts:string;municipalCorpMandals:string;municipalitiesTehsils:string;gramPanchayats:string;districts:DistrictFeature[]};
  dailyLogs:DailyLog[];
  organizations:OrganizationRecord[];
  rathPlans:RathPlan[];
  events:Festival[];
  eventObservations:string;
  strategicActions:StrategicAction[];
  importantDecisions:string;
  committees:{national:CommitteeMember[];state:CommitteeMember[];district:CommitteeMember[]};
  finalRoute:RouteDay[];
};

const id=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():Math.random().toString(36).slice(2);
export const categories=['Educational','Religious','Social','Ashram','Temple','SHG'] as const;
export const participationOptions=['Maha Rath Yatra','Rath Yatra','Night Halt','Welcome / Reception','Mahasabha','Sabha','Other'] as const;
export const supportOptions=['Venue','Accommodation','Food / Prasad','Volunteer Support','Transportation','Parking','PR / Crowd Mobilization','Local Coordination','Publicity / Communication'] as const;

export const makers={
 team:():TeamMember=>({id:id(),name:'',role:'',contact:'',area:'',remarks:''}),
 district:():DistrictFeature=>({id:id(),districtName:'',keyFeatures:''}),
 person:():DailyPerson=>({id:id(),name:'',discussion:false}),
 dailyOrg:():DailyOrg=>({id:id(),name:'',discussion:false}),
 daily:(n=1):DailyLog=>({id:id(),date:'',dayNo:n,from:'',to:'',distance:'',persons:[],organizations:[],otherPlaces:'',completedTasks:'',findings:''}),
 contact:():ContactPerson=>({id:id(),name:'',designation:'',contact:'',organizationRole:'',remarks:''}),
 joining:():RathJoining=>({id:id(),name:'',from:'',to:'',joinPoint:'',originalPlanRemarks:''}),
 venue:():VenueBlock=>({venueName:'',address:'',expectedNumber:'',capacity:'',parkingLogistics:'',localSupport:'',remarks:''}),
 night:():NightHalt=>({reason:'',accommodationAvailability:'',distanceFromRoute:'',accommodationType:'',parking:'',capacity:'',foodArrangements:'',availableFacilities:'',otherConsiderations:''}),
 organization:(state=''):OrganizationRecord=>({id:id(),name:'',categories:[],otherCategory:'',fullAddress:'',city:'',district:'',state,phone:'',headRepresentative:'',websiteEmail:'',otherDetails:'',contacts:[],participation:[],mahaRath:{proposedLocation:'',expectedParticipation:'',venueDetails:'',parkingAvailability:'',accommodation:'',localCoordination:'',otherLogistics:'',remarks:''},expectedJoiningCount:'',rathJoinings:[],mahasabha:{venueName:'',address:'',expectedNumber:'',capacity:'',parkingLogistics:'',localSupport:'',remarks:''},sabha:{venueName:'',address:'',expectedNumber:'',capacity:'',parkingLogistics:'',localSupport:'',remarks:''},nightHalt:{reason:'',accommodationAvailability:'',distanceFromRoute:'',accommodationType:'',parking:'',capacity:'',foodArrangements:'',availableFacilities:'',otherConsiderations:''},notInRoute:false,notInRouteReason:'',supportAreas:[],otherSupport:'',supportRemarks:''}),
 stop:():RathStop=>({id:id(),location:'',arrivalTime:'',haltDuration:'',facilities:'',remarks:''}),
 rath:():RathPlan=>({id:id(),name:'',route:['','','','',''],keyActivities:'',arrivalTime:'',arrivalLocation:'',vehicleCount:'',vehicleDetails:'',expectedNumber:'',stops:[],accommodationCapacity:'',parkingCapacity:'',otherFacilities:'',remarks:''}),
 event:():Festival=>({id:id(),name:'',dateDuration:'',location:'',expectedNumber:'',relevance:'',coordinationNotes:''}),
 action:():StrategicAction=>({id:id(),issue:'',action:'',responsible:'',timeline:'',status:'',remarks:''}),
 member:():CommitteeMember=>({id:id(),nameDesignation:'',institution:'',mobileEmail:'',cityState:'',cityDistrict:'',districtAddress:''}),
 route:(n=1):RouteDay=>({id:id(),dayNo:n,date:'',from:'',to:'',distance:'',intermediatePlaces:'',haltVenue:'',activities:'',remarks:''})
};

export function blankSimpleSurvey(state=''):SimpleSurveyData{return {
 meta:{state,surveyPeriod:'',teamCoordinator:'',date:'',team:[]},
 stateProfile:{totalPopulation:'',totalArea:'',totalDistricts:'',municipalCorpMandals:'',municipalitiesTehsils:'',gramPanchayats:'',districts:[]},
 dailyLogs:[],organizations:[],rathPlans:[],events:[],eventObservations:'',strategicActions:[],importantDecisions:'',
 committees:{national:[],state:[],district:[]},finalRoute:[]
}}

export function surveyCompletion(d:SimpleSurveyData){
 const checks=[d.meta.state,d.meta.teamCoordinator,d.stateProfile.totalDistricts,d.dailyLogs.length,d.organizations.length,d.rathPlans.length,d.events.length,d.strategicActions.length,d.finalRoute.length];
 return Math.round(checks.filter(Boolean).length/checks.length*100);
}