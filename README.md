# Pharmacy EMR (emr.psx.ng)

A pharmacy-level patient consultation and medical records system, built from
the PRD in this repo's history. Next.js (App Router, TypeScript) + Prisma.

## Getting started

Needs a Postgres database — either run one locally with Docker, or point
`DATABASE_URL` at a hosted one (Neon, Supabase, Vercel Postgres, etc.).

```bash
npm install
cp .env.example .env
docker compose up -d      # local Postgres on :5432 (skip if using a hosted DB)
npx prisma migrate dev    # applies prisma/migrations
npm run db:seed           # sample pharmacy, staff, and four patients
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seeded pharmacy is
"Monak Pharmacy" and the seeded pharmacist is `pharmacist@monak.test`.

### Deploying (e.g. Vercel)

Set `DATABASE_URL` in the host's environment variables to your production
Postgres connection string. `npm run build` runs `prisma migrate deploy`
first, which applies committed migrations from `prisma/migrations` — it
never touches schema outside of what's already been migrated and reviewed
locally via `prisma migrate dev`. Don't use `prisma db push` for this; it
skips migration history and can silently drop data.

## What's here

- **Data model** (`prisma/schema.prisma`) — Pharmacy/Branch/Staff tenancy,
  Patient, Encounter and its sub-records (Complaint, Hpc, PatientHistorySnapshot,
  ReviewOfSystems, Assessment, ManagementPlan), and a polymorphic AuditLog for
  every change to the locked patient-identity fields. Postgres everywhere
  (local via Docker, production via a hosted provider) — see "Getting started".
- **Encounter flow** (`src/app/encounter/**`) — the full linear wizard:
  identification → (consent, new patients only) → complaint → HPC → history/vitals
  → review of systems → assessment → management plan (treat / refer / diagnostics),
  plus the diagnostics-resume flow.
- **Patient record** (`src/app/patients/[id]`) — locked identity with a
  deliberate edit action and inline date-stamped audit trail, plus the full
  encounter timeline.
- **Design system** (`src/app/globals.css`) — CSS custom properties (`--brand`,
  `--brand-light`, etc.) so a tenant layout can override branding per pharmacy
  without touching component code.

## Stubbed integration points — read before wiring up real AI/face/POS

Three things are intentionally stubbed so the whole app is clickable without
external dependencies. Each has a `// TODO` at the call site:

- **`src/lib/ai/client.ts`** — every Gemma/Whisper call (transcription,
  complaint summarization, HPC/ROS question generation, assessment
  suggestions, counselling notes). Transcription and generation are two
  separate model pipelines (Whisper for ASR, Gemma 2B for text) — both meant
  to run fully on-device via transformers.js. Validate real latency on
  target hardware before removing the stub; a 2B model in-browser is the
  highest-risk item in the PRD.
- **`src/lib/face/client.ts`** — face-api.js (or a maintained alternative)
  capture/match, scoped per pharmacy, threshold 0.6.
  **Currently captures nothing — encoding pre-consent must be a persisted
  operation only after consent is recorded (PRD Section 12 / NDPR).**
- **`src/lib/pos.ts`** — the POS handoff. Currently mints a fake transaction
  id instead of posting to pos.psx.ng.

## Multi-tenancy

`src/lib/tenant.ts` resolves the pharmacy from the request subdomain
(`monak.emr.psx.ng` → subdomain `monak`), falling back to the first seeded
pharmacy on localhost where there's no subdomain to key off of. There's no
real staff auth yet — `getCurrentStaff` returns the first staff row for the
resolved pharmacy so every write has a valid audit-log author.
