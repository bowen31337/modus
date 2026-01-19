# Modus - Community Moderation System

## Project Overview
**Modus** is a lightweight, high-efficiency community moderation platform designed for agents to discover, manage, and respond to community posts. It features intelligent prioritization, AI-assisted drafting (RAG), and real-time synchronization.

### Tech Stack
- **Monorepo:** Turborepo
- **Package Manager:** pnpm
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase Edge Functions
- **Database:** Supabase PostgreSQL (with `pgvector` for RAG)
- **Auth:** Supabase Auth with RLS
- **Real-time:** Supabase Realtime (WebSockets)
- **AI:** Vercel AI SDK
- **Tooling:** Biome (Linting/Formatting), Vitest (Unit Testing), Playwright (E2E Testing)

## Building and Running

### Prerequisites
- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Supabase CLI

### Key Commands
- **Install Dependencies:** `pnpm install`
- **Start Development:** `pnpm dev` (starts Turbo dev server)
- **Build Production:** `pnpm build`
- **Unit Tests:** `pnpm test` (Vitest)
- **E2E Tests:** `pnpm test:e2e` (Playwright)
- **Lint:** `pnpm lint` (Biome)
- **Format:** `pnpm format` (Biome)
- **Typecheck:** `pnpm typecheck`

### Database Setup
```bash
supabase start
supabase db push
supabase db seed
```

## Development Conventions

### Structure
- `apps/web`: Main Next.js application
    - `app/`: App Router pages
    - `features/`: Feature modules (moderation, assignment, rules)
- `packages/ui`: Shared UI components
- `packages/logic`: Shared business logic (validation, rules, AI)
- `supabase`: Database migrations, edge functions, seed data

### Standards
- **Styling:** Tailwind CSS with shadcn/ui components.
- **Linting/Formatting:** Strict adherence to Biome rules.
- **Testing:** Unit tests with Vitest for logic; E2E with Playwright for flows.
- **State Management:** React Server Components + Client Components with local state/Context/Supabase Realtime.

### User Preferences & "Yolo Mode"
- **Interaction Style:** "Yolo Mode" - proceed quickly, minimize excessive validation steps ("yoo for 1").
- **Python:** Use `uv` if Python scripts are needed.
- **TypeScript:** Strictly use `pnpm`, `turbo`, `vitest`, `biome`.
- **Documentation:** Skip User Stories/Epics in PRDs; focus on Functional (FR) and Non-Functional (NFR) requirements.

## Critical Issues & Current Status (Jan 2026)
- **Status:** ~85% complete (170/200 features passing).
- **Failing Areas:**
    - **Security:** Missing XSS prevention, CSRF protection, and thorough RLS policies.
    - **Real-time:** Sync latency > 2s, subscription connection issues.
    - **Infrastructure:** Migration/Seed script failures, RAG integration issues.
    - **Performance:** Load times > 1s, interaction delays.
    - **Accessibility:** Missing ARIA labels, contrast issues, screen reader support.
- **Priorities:** Security & Access Control > Real-time Sync > Database/Infra > Performance.
