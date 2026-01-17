# m - Community Moderation System

A lightweight, high-efficiency community moderation platform for agents to discover, manage, and respond to community posts. Features intelligent prioritization rules, LLM-assisted drafting with RAG, click-to-assign workflow, and real-time synchronization.

## Features

- **Unified Content Stream**: Filterable feed with full-text search
- **Intelligent Prioritization**: Auto-priority based on rules (first-time posters, sentiment, SLA)
- **Click-to-Assign Workflow**: Implicit ownership on post click
- **AI-Assisted Responses**: RAG-powered suggestions with ghost text streaming
- **Real-time Sync**: Changes reflect across dashboards within 2 seconds
- **Keyboard-First Navigation**: J/K navigation, shortcuts for power users
- **RBAC**: Agent, Supervisor, Admin, and Moderator roles

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase Edge Functions
- **Database**: Supabase PostgreSQL with pgvector for RAG
- **Authentication**: Supabase Auth with Row Level Security
- **Real-time**: Supabase Realtime (WebSockets)
- **AI**: Vercel AI SDK for LLM streaming
- **Tooling**: pnpm, Turborepo, Biome, Vitest, Playwright

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd modus

# Run the setup script
./init.sh

# Or manually:
pnpm install
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
modus/
├── apps/
│   └── web/                     # Next.js Application
│       ├── app/                 # App Router pages
│       ├── components/          # App-specific components
│       ├── features/            # Feature modules
│       │   ├── moderation/      # Queue and post detail
│       │   ├── assignment/      # Agent status and claims
│       │   └── rules/           # Priority rules UI
│       ├── hooks/               # Custom React hooks
│       └── lib/                 # Utilities and configs
├── packages/
│   ├── ui/                      # Shared UI components
│   └── logic/                   # Shared business logic
│       ├── validation/          # Zod schemas
│       ├── rules/               # Rules engine
│       └── ai/                  # AI helpers
├── supabase/
│   ├── migrations/              # Database migrations
│   ├── functions/               # Edge Functions
│   └── seed.sql                 # Seed data
├── tests/
│   └── e2e/                     # Playwright tests
├── scripts/                     # Build/deploy scripts
├── reports/                     # Test reports
└── docs/                        # Documentation
```

## Environment Setup

1. Copy the environment example:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. Add your AI provider API key:
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`

## Database Setup

With Supabase CLI installed:

```bash
# Start local Supabase
supabase start

# Run migrations
supabase db push

# Seed initial data
supabase db seed
```

Or use the hosted Supabase dashboard to run the migration files manually.

## Development

```bash
# Start development server
pnpm dev

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `J` | Navigate down in queue |
| `K` | Navigate up in queue |
| `Enter` | Open post (auto-assign) |
| `R` | Focus reply editor |
| `Tab` | Accept AI suggestion |
| `Cmd+Enter` | Post and resolve |
| `Cmd+Shift+A` | Open reassign menu |
| `Cmd+K` | Command palette |
| `Esc` | Close detail view |

## Design System

- **Theme**: Obsidian Flow (Dark Mode First)
- **Primary Color**: Indigo-500 (#6366f1)
- **Priority Colors**:
  - P1 Critical: Red-500 (#ef4444)
  - P2 High: Orange-400 (#fb923c)
  - P3 Medium: Slate-400 (#94a3b8)
  - P4 Low: Emerald-400 (#34d399)
- **Typography**: Inter (primary), Geist Mono (monospace)
- **Spacing**: 4px/8px grid system

## Contributing

1. Check `feature_list.json` for pending features
2. Create a feature branch
3. Make your changes
4. Run `pnpm lint && pnpm test`
5. Submit a pull request

## License

Private - All Rights Reserved
