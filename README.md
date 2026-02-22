# MedScribe

AI-powered medical documentation assistant: discharge summaries, case sheets, PDF/Word/HTML export, and more.

## Features

- **Patients & Consultations**: CRUD, search (name, MRN, phone, DOB), consultation status (draft / in progress / finalized / archived), clone consultation
- **AI document generation**: Discharge summary and case sheet from transcript; optional ICD-10 suggestions; regenerate from current text; specialty templates (cardiology, surgery, etc.) and custom templates with variables (`{{patientName}}`, `{{consultationDate}}`)
- **Export**: PDF (hospital-style header/footer, draft watermark, signature placeholder), Word (.docx), HTML; batch export (ZIP of PDFs)
- **Security**: Session timeout, RBAC (doctor/nurse/admin), audit log, rate limiting on generation
- **Analytics & reports**: Dashboard metrics, CSV export
- **Integrations**: Optional webhook on consultation finalized; health check at `/api/health`

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind, Prisma, PostgreSQL, NextAuth (JWT), Groq/Gemini for AI, jsPDF, docx, jszip

## Setup

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `DATABASE_URL` (PostgreSQL), `NEXTAUTH_SECRET`, and at least one of `GROQ_API_KEY` or `GEMINI_API_KEY`
   - Optional: `HOSPITAL_NAME`, `WEBHOOK_URL`

3. **Database**
   ```bash
   npx prisma db push
   npx prisma db seed   # optional
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Register or log in.

## Docker

- **App + Postgres**
  ```bash
  docker-compose up -d
  ```
  App: http://localhost:3000. DB: postgres:5432 (user/pass: postgres/postgres). Set env vars in `.env` or in `docker-compose.yml`.

- **App only** (use existing DB):
  ```bash
  docker build -t medscribe .
  docker run -p 3000:3000 -e DATABASE_URL=... -e NEXTAUTH_SECRET=... -e GROQ_API_KEY=... medscribe
  ```

## API overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check (DB + optional AI config) |
| `GET/POST /api/patients` | List (search: search, phone, mrn, dob), create |
| `GET/POST /api/consultations` | List (search, status, patientId), create |
| `POST /api/consultations/:id/clone` | Clone consultation |
| `PATCH /api/consultations/:id` | Update transcript, status (triggers webhook on finalized) |
| `POST /api/documents/generate` | Generate document (includeIcd10, template) |
| `POST /api/documents/:id/regenerate` | Regenerate from current content |
| `GET /api/documents/:id/pdf` | Download PDF |
| `GET /api/documents/:id/word` | Download Word |
| `GET /api/documents/:id/html` | Download HTML |
| `POST /api/documents/batch-export` | Body: `{ documentIds: string[] }` → ZIP of PDFs |
| `GET/POST /api/templates` | List, create custom templates |
| `GET /api/analytics?range=30` | Analytics for dashboard |
| `GET /api/reports/export?format=csv&days=30` | CSV report |

## Testing & monitoring

- **Health check**: `GET /api/health` returns DB and AI config status (use for load balancers or k8s probes).
- **Error tracking**: For production, add [Sentry](https://sentry.io) (or similar) and initialise in `instrumentation.ts` or `_app.tsx`; avoid logging PII.
- **Tests**: Add unit tests (e.g. `lib/utils`, `lib/generate-pdf`) and E2E (e.g. Playwright) for the main document flow; run with your preferred runner (Jest, Vitest, etc.).

## License

MIT
