# TenantIQ — AI-Powered Tenant Screening

**Live app:** [https://tenant-iq-two.vercel.app](https://tenant-iq-two.vercel.app)

TenantIQ is a multi-agent AI tenant screening platform built for independent landlords and property managers. It deploys 6 specialized AI agents to analyze a rental application in under 60 seconds, producing a scored report with an APPROVE / CONDITIONAL / DECLINE recommendation that is Fair Housing Act compliant.

---

## Features

- **6 AI Agents** running in sequence — Credit, Income, Rental History, Risk Assessment, Fair Housing Compliance, and Screening Report
- **Landlord rent-lock** — landlord sets the monthly rent before sharing the application link; rent is locked for the tenant and drives all income calculations
- **Plaid income verification** — simulated income check compares stated income against verified deposit history
- **Employer verification** — cross-references employer name against public business data
- **ZIP code verification** — validates applicant address and flags state mismatches
- **Fair Housing compliance** — every decision is audited to confirm it is based solely on objective financial criteria
- **Weighted scoring** — Income (35%) + Rental History (28%) + Credit (22%) + Risk (15%)
- **Multi-property dashboard** — all screenings in one place with filter by status, per-application delete, and full report drill-down
- **Auth** — email/password sign-in via Supabase Auth; protected routes redirect unauthenticated users to sign-in
- **Persistent storage** — results saved to Supabase (PostgreSQL) with localStorage fallback for offline access

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| AI agents | Google Gemini 1.5 Flash via `@google/generative-ai` |
| Database | Supabase (PostgreSQL + Auth) |
| Income verification | Plaid (simulated sandbox) |
| Deployment | Vercel |

---

## How It Works

1. **Setup** — Landlord enters the monthly rent for their unit at `/setup`, then either copies a link to share with the tenant or fills out the form themselves.
2. **Apply** — Tenant completes a 4-step form (personal info, rental history, employment, financial background). The rent is locked and visible but not editable.
3. **Processing** — The application is submitted to `/api/screen`, which runs the 6 AI agents in sequence using Gemini. External verifications (ZIP, employer, Plaid income) run in parallel before the agents start.
4. **Results** — A full scored report is displayed at `/results/[id]` with per-agent breakdowns, verification status, Fair Housing audit, and an adverse action notice if the decision is DECLINE.
5. **Dashboard** — All past screenings are listed at `/dashboard` with summary stats, recommendation badges, and links to individual reports.

---

## Scoring

```
Final Score = Income Score × 35%
            + Rental History Score × 28%
            + Credit Score × 22%
            + Risk Score × 15%
```

| Score | Recommendation |
|---|---|
| 70 – 100 | APPROVE |
| 50 – 69 | CONDITIONAL |
| 0 – 49 | DECLINE |

All individual agent scores are floored at 15 to prevent near-zero outputs for worst-case applicants.

---

## Environment Variables

Create a `.env.local` file in the project root with the following:

```env
GEMINI_API_KEY=your_google_ai_studio_key

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
```

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** If your project is inside an OneDrive-synced folder on Windows, OneDrive may intermittently lock files in the `.next` cache during development. Pausing OneDrive sync while developing eliminates this.

---

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the following SQL to create the applications table:

```sql
create table applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  applicant_name text,
  applicant_email text,
  overall_score integer,
  recommendation text,
  status text default 'complete',
  agent_results jsonb
);
```

3. In **Authentication → Settings**, configure your site URL and redirect URLs to match your deployment domain
4. Optionally disable email confirmation for development under **Authentication → Settings → Email Auth**

---

## Deployment

The app is deployed on Vercel. To deploy your own instance:

1. Push the repository to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Deploy — Vercel auto-deploys on every push to `main`

**Live:** [https://tenant-iq-two.vercel.app](https://tenant-iq-two.vercel.app)

---

## Project Structure

```
tenantiq/
├── app/
│   ├── page.tsx              # Marketing homepage
│   ├── signin/page.tsx       # Sign in / create account
│   ├── setup/page.tsx        # Landlord rent entry + link generation
│   ├── apply/page.tsx        # Tenant application form (4 steps)
│   ├── processing/[id]/      # Live agent progress screen
│   ├── results/[id]/         # Full screening report
│   ├── dashboard/page.tsx    # Landlord dashboard
│   └── api/
│       ├── screen/route.ts   # Main screening endpoint (runs all agents)
│       └── applications/     # CRUD for application records
├── lib/
│   ├── agents.ts             # 6 Gemini AI agents + scoring logic
│   ├── verifications.ts      # ZIP, employer, Plaid income verification
│   ├── supabase.ts           # Supabase client helpers
│   ├── useRequireAuth.ts     # Auth guard hook + signOut utility
│   └── utils.ts              # Score labels, date formatting
```

---

*For demonstration purposes only. Not legal advice. Consult a licensed attorney before issuing adverse action notices.*
