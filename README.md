# Pharmacy EMR (emr.psx.ng)

A pharmacy-level patient consultation and medical records system, built from
the PRD in this repo's history. Next.js (App Router, TypeScript) + Prisma.

## Getting started

Needs a MongoDB database, running as a replica set (required by Prisma's
Mongo connector, even for a single local node) — either run one locally
with Docker, or point `DATABASE_URL` at a hosted one (MongoDB Atlas' free
tier is already a replica set, no extra config needed).

```bash
npm install
cp .env.example .env
# edit .env: set AUTH_SECRET to the output of `openssl rand -base64 32`
docker compose up -d      # local Mongo replica set on :27017 (skip if using Atlas)
npx prisma db push        # syncs prisma/schema.prisma to the database
npm run db:seed           # sample pharmacies, staff, and patients
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to
`/login`. Seeded logins:

| Pharmacy | Email | Password |
|---|---|---|
| Monak Pharmacy | `pharmacist@monak.test` | `password123` |
| Medlife Pharmacy | `pharmacist@medlife.test` | `medlife123` |

Change these before any real use — they're seed data, not meant to survive
past early demos.

### Deploying (e.g. Vercel)

Set two environment variables on the host:

- `DATABASE_URL` — your Atlas (or other hosted Mongo) connection string.
- `AUTH_SECRET` — required by NextAuth/Auth.js; sign-in throws `MissingSecret`
  without it. Generate with `openssl rand -base64 32`. (Vercel sets `VERCEL=1`
  automatically, which Auth.js uses to trust the deployment's host — no
  `AUTH_TRUST_HOST` needed there specifically, but do set it if self-hosting
  anywhere else.)

`npm run build` runs `prisma db push` first — this is the correct workflow
for Mongo (unlike SQL databases, Mongo has no migration history to apply;
Prisma's `migrate` commands aren't supported on this connector at all).
`db push` mainly syncs indexes (`@unique`, `@@index`) and refuses to run
destructively without `--accept-data-loss`, so a build never silently drops
data.

## What's here

- **Data model** (`prisma/schema.prisma`) — Pharmacy/Branch/Staff tenancy,
  Patient, Encounter and its sub-records (Complaint, Hpc, PatientHistorySnapshot,
  ReviewOfSystems, Assessment, ManagementPlan), and a polymorphic AuditLog for
  every change to the locked patient-identity fields. MongoDB everywhere
  (local via Docker, production via Atlas or similar) — see "Getting started".
  Nested/array-shaped fields (allergies, medicines dispensed, HPC answers,
  etc.) are still stored as JSON-encoded strings rather than Mongo's native
  document nesting — carried over from an earlier SQLite version of this
  schema. Works fine as-is; converting them to proper nested/array fields
  would be a reasonable follow-up if you want to query into them directly.
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
- **`src/lib/pos.ts`** — the POS handoff. Currently mints a fake transaction
  id instead of posting to pos.psx.ng.

Face recognition is no longer stubbed — `src/components/face/FaceScanner.tsx`
runs `@vladmandic/face-api` (a maintained face-api.js fork) fully client-side
against the model weights in `public/models/`, and `src/app/api/patients/face-search/route.ts`
matches embeddings by cosine similarity, scoped to the logged-in user's
pharmacy. Still worth validating capture-before-consent handling (PRD Section
12 / NDPR) before relying on it for real patients.

## Multi-tenancy and auth

Staff sign in via `/login` (NextAuth/Auth.js credentials provider,
`src/auth.ts`); `src/proxy.ts` gates every non-API route behind a session.
`src/lib/tenant.ts` resolves the current pharmacy from the logged-in staff
member's `pharmacyId` — no more subdomain-based resolution, so multi-tenancy
now depends entirely on which account you're signed in as, not the URL.
