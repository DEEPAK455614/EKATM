# RBAC / RLS

Authorization is enforced in PostgreSQL, not only in the UI.

## Roles

- Field Surveyor (`shankhdoot` in the existing system)
- Survey Team Coordinator
- Survey Lead
- District Coordinator
- State Coordinator
- State Administrator
- National Operations Team
- CRM Manager
- Data Analyst
- Knowledge Manager
- AI / Intelligence Manager
- Auditor / Read-Only Reviewer
- System Administrator
- Super Administrator

## Principle

A role answers **what action may be performed**. Geographic assignment answers **where it may be performed**. Both are required where applicable.

Examples:

- A State Coordinator may have `surveys.approve`, but RLS restricts access to assigned state scope.
- CRM permissions do not automatically expose a national contact directory.
- AI access does not expand the caller's data scope.
- National/system roles are explicitly global.

## Survey permissions

`surveys.view`, `surveys.capture`, `surveys.review`, `surveys.approve` plus existing `field.capture` / `field.verify`.

`can_access_survey_project(uuid)` combines ownership, team membership, global operations roles and geographic assignment. `can_manage_survey_project(uuid)` additionally requires capture/review/approve permission.

## CRM permissions

Existing organization/contact/task/follow-up permissions are reused. Policies were tightened so manager permissions remain bounded by creator/owner or linked organization geography unless the caller is a global administrator.

## AI permissions

- `intelligence.use`
- `intelligence.manage`
- `knowledge.manage`

The intelligence API authenticates the caller and performs all retrieval using that user's bearer token. RLS executes before any model call.

## Sensitive exports

Exports must be generated from already authorized query results. Audit events should record material export workflows when a server-side export is used. Contact information must not be included in broad datasets where the role does not require it.

## First user

The existing `handle_new_user_yatra` Auth trigger creates a profile for each signup. In a fresh database, the first Auth user becomes `system_admin` with national assignment; subsequent users default to the restricted field role until an administrator assigns roles/geography. The trigger function is not exposed as a callable RPC.
