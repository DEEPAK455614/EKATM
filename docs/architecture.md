# Ekatma Yatra Intelligence — Architecture

## Product boundary

Ekatma Yatra Intelligence is one operational platform with four surfaces sharing one PostgreSQL source of truth:

1. **Field Survey PWA** — mobile-first, offline-capable survey capture.
2. **Ekatma CRM** — organizations, people, interactions, commitments, tasks and follow-ups.
3. **Operations/Admin** — survey review, route, venue, night halt, committee, events, analytics and reports.
4. **AI Intelligence** — authorized retrieval, deterministic metrics, grounded summaries, data-quality assistance and provenance.

The source survey is modeled explicitly in `docs/survey-field-mapping.md`.

## Runtime

- Frontend/API: Next.js + React + TypeScript
- Primary datastore/auth: Supabase PostgreSQL + Auth + RLS
- Offline: IndexedDB/Dexie + service-worker application shell + outbox
- Ekatma Intelligence OS remains a separate product/service. This repository contains the survey/CRM platform.
- AI: provider abstraction boundary in server-only API routes. The current implementation supports Gemini when `GEMINI_API_KEY` is configured and degrades safely without it.
- Exports: client-generated PDF and normalized multi-sheet XLSX.

## Trust boundaries

Browser code receives only public Supabase configuration. User JWTs are used for all database access; PostgreSQL RLS remains authoritative. AI provider credentials stay server-side. Internal data is retrieved through the caller's JWT before any model call, so the model only receives records the caller was already authorized to read.

## Authoritative data flow

Field input → IndexedDB autosave → outbox → authenticated sync endpoint → full source payload in `field_submissions` + normalized operational records → RLS-filtered dashboards/CRM/route → deterministic SQL/PostgREST facts → optional AI explanation.

Human-entered survey observations are separate from CRM master data. AI outputs are stored separately and marked review-required.

## Failure isolation

- Internet unavailable: survey continues locally.
- Sync unavailable: latest draft stays in IndexedDB/outbox.
- AI unavailable: survey, CRM, reports, route and deterministic metrics continue.
- Model failure never blocks survey submission.
- Duplicate/merge decisions remain human-controlled.

## Main application routes

- `/survey`
- `/survey/:localSurveyId`
- `/admin`
- `/admin/crm`
- `/admin/route`
- `/admin/intelligence`
- `/admin/reports`
- `/admin/settings`
- `/api/survey/sync`
- `/api/intelligence`
- `/api/health`
