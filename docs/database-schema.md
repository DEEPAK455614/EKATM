# Database Schema — Ekatma Yatra Intelligence

The platform uses the existing Supabase project **EkAtma Yatra Operations** and extends it additively. Existing CRM/operations tables (`organizations`, `contacts`, `organization_contacts`, `interactions`, `followups`, `tasks`, `field_submissions`, `documents`, `audit_events`, etc.) are reused instead of duplicated.

## Survey domain

- `survey_projects` — state survey root/status/revision.
- `survey_team_members` — unlimited State Survey Team rows.
- `state_profiles` — State at a Glance statistics.
- `district_features` — district/key-feature observations.
- `daily_logs` — day/date/journey/distance/findings.
- `daily_person_discussions`, `daily_organization_discussions` — planned/complete discussions.
- `survey_organization_visits` — historical organization observations.
- `survey_contact_observations` — historical contacted-person observations.
- `organization_participation`, `maha_rath_participation` — participation/conditional Maha Rath details.
- `gathering_venues`, `night_halts` — Sabha/Mahasabha and night halt assessments.
- `institutional_support` — structured support capabilities observed in survey.
- `rath_yatra_plans`, `rath_route_stops` — joining/proposed Rath Yatra plans and major halts.
- `events_festivals` — event/festival context.
- `strategic_actions`, `survey_decisions_followups` — action plan and decisions.
- `committees`, `committee_members` — National/State/District proposed committees.
- `final_route_days` — unlimited day-wise final route rows.
- `survey_reviews` — submit/return/approve/reject/reopen history.
- `survey_conflicts` — optimistic concurrency/conflict records.

## CRM/intelligence additions

- `organization_commitments` — typed support commitments with verification/evidence/due dates.
- `data_quality_flags` — rule/AI quality warnings with human resolution.
- `ai_generations` — model output, source refs and review status.
- `ai_usage` — tokens/latency/cost/success metrics.
- `ai_feedback` — helpful/incorrect/missing-context feedback.
- `states`, `districts` — reference geography for future structured selection.

## Integrity

All new primary keys are UUIDs. Foreign keys use explicit cascade/set-null semantics. Material records are covered by the existing immutable-style append audit event mechanism (`audit_events` via `audit_row_change`). Indexes cover state/status, project/date, organization linkage, due/status, route day, quality status and AI usage.

## Master vs observation

`organizations` / `contacts` hold CRM master records. `survey_organization_visits` / `survey_contact_observations` preserve what a surveyor recorded at that time. Updating a CRM master never erases historical field observations.

## Production migrations already applied

1. `ekatma_yatra_survey_crm_intelligence_v1`
2. `harden_survey_security_definer_access`
3. `tighten_survey_project_geographic_access`
4. `tighten_crm_and_survey_geographic_rls`

The complete paper-to-database mapping is in `docs/survey-field-mapping.md`.
