# Survey platform 1.1

## Registration fix

The Create Account screen called Supabase signup, but `guard_auth_user_registration`
and `handle_new_user` rejected all non-invited users. A transaction reproduced the
exact exception before the fix. Three overlapping auth triggers are now replaced
with one deterministic trigger. It creates a profile with name/email/phone and
only the `shankhdoot` surveyor role. It never grants admin rights, trusts a requested
role in user metadata, or allocates a State. Existing grants remain unchanged.
Email verification stays enabled. Confirmation and password recovery use the auth
provider's mail configuration. Delivery to a real mailbox was not tested by this
release. The production `/field` and `/auth/reset` URLs must be allowed by the
Supabase email redirect configuration.

## Surveyor

1. Register at `/field`, confirm your email, then sign in.
2. Admin assigns a State. Refresh assignments or wait for the 30-second refresh.
3. Open your State and complete the existing PDF-based sections.
4. Edits persist immediately on the device; while the survey is open they autosync
   after a short pause. Save also triggers sync. Pending final submissions sync
   when the selected survey reconnects. Reopen any other device draft to sync it.
5. Attach photos/reports/audio/video in Review. Uploads require internet, support
   multiple files, and have a 20 MB file limit. Link them to a day or the whole State.
6. Download a daily or complete PDF. Submit for final review after checking it.
7. Submitted/reviewed data is locked. Admin correction requests reopen editing.

Offline first-load requires a previous successful online visit. The app caches
only its public field shell/static assets, never database/auth/admin responses.
Keep the original device until it reports Saved to central server. Clearing browser
storage removes unsynced local drafts. File uploads are online-only.

## Administrator

`/admin` requires an authorized role, checked in the UI and database. Registered
profiles show people awaiting assignment and their States/report history. Allocate
States, inspect every nested field, filter surveys by status, export the register
to CSV, review reports and leave specific correction notes. Saved-version history
contains immutable snapshots (latest 50 listed, older rows retained). Private file
links expire after two minutes.

## Data integrity

`save_simple_survey` atomically saves the form, assignment status and version.
Ownership, active profile, authoritative State, submission locks and revision
checks are server enforced. Stale writes are rejected with a comparison workflow;
automatic sync never silently overwrites a newer device's report. Reviews use an
admin-only RPC and also produce a version snapshot. Authenticated clients cannot
write forms or version history directly. Profiles are visible to their owner and
permitted administrators only. No existing survey records were deleted.

## Validation and deployment

- `npm test`: registration form, password mismatch, autosave RPC, offline
  preservation and admin denial for role-less users.
- `npm run build`: production compilation and TypeScript.
- `tests/registration.sql`: deterministic profile, least-privilege role, no
  automatic assignment; rollback removes all synthetic records.
- `tests/workflow.sql`: save/submit/review/correct/resubmit, stale-write conflict,
  submission locking, snapshot history and RLS isolation; rollback removes fixtures.
- Apply the three dated migrations before deploying the matching frontend.
- CI uses the lockfile and runs tests before the production build.

PDF export adds pagination, missing logistics/contact details, attachment metadata
and page numbers. Print / Hindi PDF opens an escaped, complete field-by-field
report using the browser's Unicode text shaping; use its Print / Save as PDF
button for Hindi and mixed-script text. Standard jsPDF export remains available.
