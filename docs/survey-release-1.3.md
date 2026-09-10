# Survey 1.3 — field relationships and proposed routes

The field service remains in DEEPAK455614/EKATM and is linked from the operational
shell in DEEPAK455614/command-centre-ekatm-dham-. Both repositories are updated
for this release; the Command Centre /field and /surveys links use the configured
SURVEY_PLATFORM_URL, with the existing production survey URL as fallback.

## Survey changes

- Daily contacted people have Name, Mobile, Organization, Other Contact,
  Remarks and evidence in that order. Independent people are supported. Selecting
  an Organization links that person into its Connected People subsection.
- One initial Organization card, repeatable as needed; categories, address,
  auto State, representative mobile, contacts, remarks and evidence stay together.
- Camera/photo evidence is linked by stable record ID. Routes, gatherings and
  halts also accept maps as image/PDF uploads. Private signed URLs remain in use.
- Only the selected Mahasabha/Sabha details appear. Hidden legacy data is retained
  for historical reports. Night halt stays in one consolidated card per Organization.
- Major halts include significance, contacts, crowd and optional GPS. Events,
  priority/action fields, local committees and Final Proposed Route Plan are expanded.
- Administrator directory filters by record type and searches all saved details;
  matching details export to CSV, including new fields. Realtime database events
  refresh the dashboard with a 15-second fallback polling interval.
- Draft → Submitted → Under Review → Approved → Needs Revision are display labels.
  Reviewed and correction_requested remain storage values for backward compatibility.
  Approval is tied to the immutable survey revision, including its proposed route.

Apply migrations/20260910_survey_review_and_realtime.sql before the new frontend.
It preserves ownership/RLS, revision checks and submission locking, adds Under
Review, updates evidence locking and supports common phone image formats.

## Switching versions

The admin's Switch survey version link opens the GitHub Actions workflow of that
name. Repository maintainers choose Run workflow → current/previous → Run workflow.
The workflow restores a frozen release snapshot in a new main-branch commit;
it never force-pushes, deletes surveys or reverses database migrations. The
existing Render auto-deploy integration then builds the selected main commit.

- Current snapshot: release/survey-1.3
- Previous interface: release/survey-1.2-before-field-update
- Original pre-change commit: 53ba4af4b507768f5fbaa6ed5c9a67b9451522ea

The previous snapshot retains two test TypeScript corrections needed to compile
with the installed dependency versions. Its application interface is unchanged.
Existing newly added JSON fields remain stored, but the older interface will not
show all of them. Avoid edits to records containing new fields while rolled back.
Under Review records remain server-locked even when using the previous interface.
If repository Actions write permissions are disabled, Render's deploy-specific-
commit control can deploy either saved release branch commit instead.

## Verification

14 UI/model tests cover registration, offline/autosave, reports, conditional
fields, linked/independent people, map/camera metadata and directory export.
The production build performs TypeScript checking. tests/review-v2.sql exercises
save, submission, review, correction, re-submission, approval, stale writes,
ownership and immutable history in a transaction that rolls back all test rows.
