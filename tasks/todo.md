# EX Group Customer OS — Task Tracker

## Phase 0: Foundation (Week 1-2)
> Goal: Monorepo scaffolded, database schema designed, auth working, design system started.

### CHESKY (Orchestrator)
- [x] Initialize monorepo: Next.js 14 + Expo + shared packages
- [x] Set up Turborepo/npm workspaces with shared TypeScript config
- [ ] Configure Supabase project (dev + staging environments)
- [x] Write docs/SCHEMA.md with complete database schema
- [ ] Set up Vercel project for web deployment
- [ ] Configure CI: type-check + lint on every PR
- [x] Define all shared TypeScript types in `packages/shared/types/`
- [x] Create `.env.example` with all required environment variables

### LENNY (Auth & Identity)
- [ ] Configure Supabase Auth with phone OTP provider
- [ ] Create migration: `001_create_customers.sql` (customers, memberships, preferences)
- [ ] Write RLS policies for customers table
- [ ] Build phone OTP signup/login flow (mobile)
- [ ] Build phone OTP signup/login flow (web)
- [ ] Implement session refresh and token management
- [ ] Seed data: 50 test customers across 4 brands

### MIKHAIL (Booking)
- [ ] Create migration: `002_create_booking_tables.sql` (services, outlets, stylists, bookings)
- [ ] Write RLS policies for booking tables
- [ ] Seed data: all 15 outlets, sample services, sample stylists
- [ ] Build slot availability calculation (Edge Function)
- [ ] Build booking creation with conflict detection

### RASMUS (Design System)
- [x] Define design tokens for all 4 brands (colors, typography, spacing)
- [ ] Build BrandProvider context
- [ ] Build core components: Button, Input, Card, Avatar, Badge, Toast
- [x] Set up Tailwind config with brand token integration
- [ ] Build mobile equivalents with React Native StyleSheet
- [ ] Create app shell: bottom tab navigation (mobile), sidebar (web)

### PATRICK (Payments)
- [ ] Set up Stripe account and API keys
- [ ] Create migration: `003_create_wallet_tables.sql` (wallets, ledger, transactions)
- [ ] Write RLS policies for wallet tables (customers see only their own)

### YUKAI (Loyalty)
- [ ] Create migration: `004_create_loyalty_tables.sql` (ledger, stamp cards, tiers, rewards)
- [ ] Define initial tier structure and stamp card rules per brand

### ANDREW (CRM)
- [ ] Create migration: `005_create_crm_tables.sql` (segments, campaigns, health scores)
- [ ] Define initial customer segments (active, at-risk, churned, new, VIP)

### COO (Admin)
- [ ] Create migration: `006_create_admin_tables.sql` (admin_users, audit_log)
- [ ] Define role permissions and RLS policies
- [ ] Build admin login (email/password, separate from customer auth)

---

## Phase 1: Core Loop (Week 3-5)
> Goal: A customer can sign up, book a service, earn stamps, and pay with wallet.

_Tasks to be broken down after Phase 0 is complete._

- [ ] MIKHAIL: Full booking flow (browse → select → book → confirm)
- [ ] PATRICK: Wallet top-up via Stripe
- [ ] PATRICK: Pay for booking with wallet
- [ ] YUKAI: Earn stamps on completed booking
- [ ] YUKAI: View stamp card and progress
- [ ] ANDREW: Post-visit follow-up notification
- [ ] COO: Outlet manager booking dashboard
- [ ] RASMUS: Polish all Phase 1 screens

## Phase 2: Retention Engine (Week 6-8)
> Goal: Churn detection, automated campaigns, referral program, admin analytics.

_Tasks to be defined after Phase 1._

## Phase 3: Growth & Scale (Week 9+)
> Goal: Multi-currency, package purchases, advanced analytics, ML churn prediction.

_Tasks to be defined after Phase 2._
