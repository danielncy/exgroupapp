# EX Group Customer OS — Project Rules

## What This Is
Data-first customer retention app for EX Group — 15 outlets across 4 brands (EX Style, EX Beauty, UHair, Coulisse) in Malaysia/Singapore. The Luckin Coffee of beauty: frictionless booking, in-app wallet, loyalty stamps, churn prediction.

## Tech Stack
- **Frontend**: Next.js 14 (web) + Expo React Native (mobile) — monorepo
- **Backend**: Supabase (Postgres, Auth, Edge Functions, Realtime)
- **Payments**: Stripe (wallet top-up, checkout)
- **Hosting**: Vercel (web), EAS (mobile builds)
- **Language**: TypeScript strict mode everywhere. No `any`. No `@ts-ignore`.

## Project Structure
```
ex-group-app/
├── apps/
│   ├── web/          # Next.js 14 app (customer-facing + admin)
│   └── mobile/       # Expo React Native app
├── packages/
│   ├── shared/       # Shared types, utils, constants
│   ├── db/           # Supabase client, migrations, RLS policies
│   └── ui/           # Shared UI components (design system)
├── supabase/
│   ├── migrations/   # SQL migrations (numbered)
│   ├── functions/    # Edge Functions
│   └── seed.sql      # Dev seed data
├── agents/           # Agent CLAUDE.md files
├── tasks/            # Task tracking
└── docs/             # Architecture docs
```

## Workflow Rules (ALL Agents Must Follow)

### 1. Plan Before You Code
- Read the relevant CLAUDE.md and tasks/todo.md before starting
- State your plan in 3-5 bullets before writing any code
- If the task touches >3 files, write the plan in tasks/architecture.md first

### 2. Verify Before You Declare Done
- Every feature must have a working state you can demonstrate
- Run `tsc --noEmit` before claiming TypeScript work is done
- Test edge cases: empty states, error states, loading states
- Check mobile AND web if the change touches shared code

### 3. Lessons Discipline
- When you hit a non-obvious bug or learn something surprising, log it in tasks/lessons.md
- Format: `## [Date] Title` → what happened, why, fix, lesson
- Read lessons.md before starting work in an area you haven't touched recently

### 4. Database Rules
- ALL tables must have RLS policies. No exceptions.
- Every migration gets a numbered file: `001_create_customers.sql`
- Never delete data — soft delete with `deleted_at` timestamp
- All tables get: `id (uuid)`, `created_at`, `updated_at`
- Use Supabase service role key ONLY in Edge Functions, never client-side

### 5. Code Standards
- TypeScript strict mode. Define types in `packages/shared/types/`
- Use Zod for runtime validation at API boundaries
- React components: functional only, named exports
- File naming: `kebab-case.ts` for files, `PascalCase` for components
- No barrel exports (`index.ts` re-exports) — direct imports only
- Environment variables: validate on startup, fail fast if missing

### 6. Multi-Brand Architecture
- Every customer-facing table has `brand_id` column
- Every query filters by brand unless explicitly cross-brand
- UI theme tokens are brand-aware (colors, logos, copy)
- 4 brands: `ex_style`, `ex_beauty`, `uhair`, `coulisse`

### 7. Git Rules
- Branch naming: `agent/task-description` (e.g., `mikhail/booking-flow`)
- Commit messages: `[AGENT] verb: description` (e.g., `[MIKHAIL] add: booking slot picker`)
- Never push to main directly — PR with description
- Squash merge to keep history clean

### 8. Security Non-Negotiables
- No secrets in code or git. Ever.
- Supabase anon key = client-safe. Service role key = server-only.
- Stripe webhook signatures must be verified
- All user input sanitized. SQL injection impossible with Supabase client, but validate anyway.
- PII (phone, email, IC) encrypted at rest

## Brand Reference
| Brand | Code | Type | Outlets | Region |
|-------|------|------|---------|--------|
| EX Style | `ex_style` | Hair Salon | 7 | MY/SG |
| EX Beauty | `ex_beauty` | Beauty | 4 | MY/SG |
| UHair | `uhair` | Hair Salon | 3 | SG |
| Coulisse | `coulisse` | Scalp Specialist | 1 | MY |

## Agent Registry
| Agent | Domain | Persona |
|-------|--------|---------|
| CHESKY | Orchestrator | Brian Chesky × Zhang Yiming |
| LENNY | Customer Identity & Auth | Lenny Rachitsky |
| MIKHAIL | Booking Engine | Mikhail Parakhin |
| YUKAI | Loyalty & Gamification | Yu-kai Chou |
| PATRICK | Payments & Wallet | Patrick Collison |
| ANDREW | CRM & Customer Intelligence | Andrew Chen |
| RASMUS | UI/UX & Design System | Rasmus Andersson |
| COO | Admin & Ops Dashboard | Chief Operating Officer |
