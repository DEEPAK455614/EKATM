# EkAtma Yatra Survey — Paper to Digital Mapping

Authoritative source: **EkAtma Yatra Comprehensive Survey Report / State Survey (16 pages)**. Fixed paper rows become unlimited repeatable digital records. Historical field observations remain distinct from CRM master data.

| PDF page | Source section / fields | Digital destination |
|---|---|---|
| 2 | State, Survey Period, Team Coordinator, Date | `survey_projects` |
| 2 | Team Member Name, Role / Responsibility, Contact Number, Allocated Area, Remarks | `survey_team_members` |
| 3 | Total Population, Total Area, Total Districts, Municipal Corp./Mandals, Municipalities/Tehsils, Gram Panchayats | `state_profiles` |
| 3 | District Name, Key Features | `district_features` |
| 4 | Date, Day No., Journey From/To, Total Distance, Other Covered Places, Completed Tasks / Activities, Key Survey Findings | `daily_logs` |
| 4 | Persons to Discuss With, discussion-completed state, notes | `daily_person_discussions` |
| 4 | Organizations to Discuss With, discussion-completed state, notes | `daily_organization_discussions` |
| 5 | Organization Name, Type/Category, Address, City, District, State, Phone, Head/Representative, Website/Email, Other Relevant Details | `survey_organization_visits` + linked `organizations` master when appropriate |
| 5 | Contacted Persons: Name, Designation, Contact Number, Organization/Role, Remarks | `survey_contact_observations` + linked `contacts` master |
| 6 | Proposed Role/Participation: Maha Rath Yatra, Rath Yatra, Night Halt, Welcome/Reception, Mahasabha, Sabha, Other | `organization_participation` |
| 6 | Maha Rath proposed location, expected participation, venue, parking, accommodation, local coordination, other logistics, remarks | `maha_rath_participation` |
| 6 | Expected number of Rath Yatras joining, Rath name, From/To, joining point, original plan/remarks | `rath_yatra_plans` |
| 7 | Mahasabha / Sabha venue name, address, expected number, capacity, parking/logistics, local support, remarks | `gathering_venues` |
| 7 | Night halt location/reason, accommodation availability/type, distance from route, parking, capacity, food, facilities, other considerations | `night_halts` |
| 8 | If not in route — reason/relevance | `survey_organization_visits.not_in_route*` |
| 8 | Potential support: Venue, Accommodation, Food/Prasad, Volunteers, Transportation, Parking, PR/Crowd Mobilization, Local Coordination, Publicity/Communication, Other | `institutional_support` |
| 9 | Rath Yatra name, proposed route, key activities, arrival time/location, vehicle count/details, expected number | `rath_yatra_plans` |
| 9 | Major halting places, ETA, halt duration, facilities, remarks | `rath_route_stops` |
| 9 | Accommodation capacity, parking capacity, other facilities/details | `rath_yatra_plans` |
| 10 | Event/Festival, date/duration, location, expected number, relevance, coordination notes, observations/scheduling | `events_festivals` |
| 11 | Priority/Key Issue, Proposed Action, Responsible Person/Org, Timeline, Status, Remarks | `strategic_actions` |
| 11 | Important Decisions / Follow-up | `survey_decisions_followups` |
| 12 | Proposed National Committee and member details | `committees` + `committee_members`, level `national` |
| 13 | Proposed State Committee and member details | `committees` + `committee_members`, level `state` |
| 14 | Proposed District Committee and member details | `committees` + `committee_members`, level `district` |
| 15–16 | Day No., Date, From, To, Distance, Intermediate Places, Halt Venue, Activities, Remarks | `final_route_days` |

## Digital behavior

- All paper tables become **unlimited repeatable rows**.
- Drafts autosave to IndexedDB and enter an offline outbox.
- `projectId` and row UUIDs remain stable across retries, making synchronization idempotent.
- Submission preserves a complete source payload in `field_submissions` and also normalizes operational data into queryable relational tables.
- CRM master records and historical survey observations are deliberately separated: a later CRM correction must not rewrite what a field surveyor originally recorded.
- Conditional sections appear only when relevant, e.g. Maha Rath details when Maha Rath participation is selected.
- Numeric counts/capacities/distances are validated as non-negative values where applicable.
- Survey review status and revision are stored centrally; corrections can be resynchronized without recreating the project.
- Venue expected attendance can be deterministically compared with venue capacity to flag operational risk.
- AI output is never written over human-entered field evidence; generations are stored separately with provenance and review state.

## Core form sequence in the PWA

1. Deployment / State Survey Team
2. State at a Glance
3. Daily Activity
4. Organizations & Institutional Participation
5. Rath Yatra Planning
6. Events & Festivals
7. Strategic Action Plan
8. National / State / District Committees
9. Final Proposed Route
10. Review & Submit
