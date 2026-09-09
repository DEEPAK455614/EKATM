# EKATM — Yatra Survey, CRM & Intelligence

Production repository for the EkAtma Yatra field-survey, CRM, coordination, reporting, offline PWA and grounded AI platform.

This repository is intentionally separate from **Ekatma Intelligence OS**. Survey-platform code, deployment configuration and documentation live here.

## Stack
- Next.js + React + TypeScript
- Supabase Auth/Postgres/RLS
- Offline-first IndexedDB + service worker
- XLSX/PDF exports
- Grounded Gemini operational intelligence
- Render deployment

## Core areas
- `/survey` — field survey workspace
- `/admin` — executive dashboard
- `/admin/crm` — organization CRM
- `/admin/route` — route intelligence
- `/admin/intelligence` — grounded AI
- `/admin/reports` — reporting and exports
- `/api/health` — health check
