# EKATMA Pre-Yatra Field Operations

## Operating model

The platform separates two user experiences that share one Supabase/PostgreSQL source of truth:

1. **Survey Team Field Portal (`/field`)** — mobile-first daily data collection for surveyors in states, districts and cities.
2. **Field Operations Command Center (`/admin/field-ops`)** — daily monitoring, review and drill-down for Nyas operations/admin users.

Survey-team onboarding and state assignment is managed at `/admin/field-ops/setup`.

## Authoritative survey source

The field workflow is derived from the 16-page **Ekatma Yatra Comprehensive Survey Report / State Survey**. The source PDF remains authoritative; the digital experience reorganizes fields by when they are naturally collected rather than forcing a field team to complete a 16-page paper-like form every day.

### Daily Mission — source page 4

Every field day captures:
- Date and Day No.
- Full Day Journey — From / To
- Total Distance
- Persons to Discuss With and discussion completion
- Organizations to Discuss With and discussion completion
- Other Covered Places
- Completed Tasks / Activities
- Key Survey Findings

### Institution Visit — source pages 5–8

Each visited organization captures:
- organization identity, category, address and contact channels
- Head/Representative and contacted persons
- proposed participation: Maha Rath Yatra, Rath Yatra, Night Halt, Welcome/Reception, Mahasabha, Sabha, Other
- conditional Maha Rath details
- Mahasabha/Sabha venue assessments
- Night Halt assessment
- IF NOT IN ROUTE reason/relevance
- institutional support areas and remarks

### Rath & Logistics — source pages 6 and 9

Each proposed Rath Yatra captures joining point, route, activities, arrival details, vehicles, expected numbers, major halts, accommodation/parking capacity, facilities and remarks.

### Context & Action — source pages 10–11

Field teams can record relevant events/festivals, scheduling considerations, strategic priorities, proposed actions, responsible parties, timeline, status and remarks.

### State-level master survey — source pages 2–3 and 12–16

State Survey Team, State at a Glance, district features, proposed National/State/District committees and the Final Proposed Route are maintained in the complete digital State Survey (`/survey/:projectId`). These are progressive state-level outputs rather than fields that should be re-entered every day.

## Daily submission lifecycle

1. Surveyor signs in to `/field`.
2. RLS exposes only State Survey projects the user is authorized to access.
3. The field draft auto-saves locally on the device.
4. The surveyor may optionally attach current GPS location.
5. Photos, documents, visiting cards, audio/voice notes and videos can be uploaded as private daily evidence.
6. **Save & Sync** sends a working draft to the central database.
7. **Submit Day** marks the report submitted for command-center review.
8. `/admin/field-ops` shows the report and all normalized records linked to that exact `daily_log_id`.

## Data integrity / multi-team safety

Daily reports are append-safe by team/day. Each daily report owns its related observations through `daily_log_id`. Updating one report replaces only records owned by that report and does not delete another team's work.

The older comprehensive State Survey sync is also constrained to state-master rows (`daily_log_id IS NULL` / `client_day_key IS NULL`), so editing the State Survey cannot erase independent daily field submissions.

## Evidence

Evidence metadata is stored in `survey_daily_evidence`; file objects are stored in the private `yatra-media` bucket. Database RLS scopes evidence metadata to authorized survey projects. The Command Center opens evidence through short-lived signed URLs.

## Command Center daily metrics

For a selected operational date, the dashboard derives metrics from synchronized records, including:
- daily reports and submitted reports
- states active and surveyors reporting
- organizations visited
- venue assessments
- night halt candidates
- Rath Yatra proposals
- local events/festivals
- evidence files

These are deterministic database counts, not LLM-generated statistics.
