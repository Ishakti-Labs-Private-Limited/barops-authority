# BarOps Authority (Ishakti Labs Demo)

BarOps Authority is a **control and accountability platform for liquor chains**.  
It is **not a POS**. It sits above POS data, Excel uploads, and manual inputs to help central office answer:

- Which outlet needs attention today?
- Why does it need attention?
- What should regional teams review first?

This monorepo is intentionally **demo-first** with clean starter architecture and low operational complexity.

## Monorepo Structure

```text
.
|- apps/
|  |- web/                 # Next.js 14 + TypeScript + Tailwind + shadcn-style UI
|  \- api/                 # Spring Boot REST API (PostgreSQL-ready)
|- packages/
|  |- shared-types/        # Shared domain contracts
|  |- rules-engine/        # Risk scoring and outlet attention logic
|  |- demo-data/           # Demo signal feed for quick prototyping
|  \- report-templates/    # Report rendering helpers
|- infra/
|  \- postgres/
|     \- init.sql          # Initial table scaffold
|- docker-compose.yml      # Local PostgreSQL
\- .env.example            # Root environment variable reference
```

## Prerequisites

- Node.js 18.18+ (or 20+ recommended)
- npm 9+
- Java 21
- Gradle (or use your local Gradle wrapper once added)
- Docker Desktop (for PostgreSQL via Compose)

## Quick Start

1. Copy environment files:
   - PowerShell:
     - `Copy-Item .env.example .env`
     - `Copy-Item apps/web/.env.example apps/web/.env.local`
   - macOS/Linux:
     - `cp .env.example .env`
     - `cp apps/web/.env.example apps/web/.env.local`
2. Start PostgreSQL:
   - `npm run db:up`
   - First boot auto-runs SQL files in `infra/postgres/` (`001__barops_schema.sql`, `002__barops_seed_demo.sql`)
3. Install JS dependencies:
   - `npm install`
4. Start the API (from repo root):
   - `npm run dev:api`
5. Start the web app (from repo root):
   - `npm run dev:web`

Web: `http://localhost:3000`  
API health: `http://localhost:8080/api/v1/health`  
API attention endpoint: `http://localhost:8080/api/v1/attention`

## Environment Variables

### Root (`.env.example`)

- `API_PORT`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `CORS_ALLOWED_ORIGINS`
- `NEXT_PUBLIC_API_BASE_URL`

### Web (`apps/web/.env.example`)

- `NEXT_PUBLIC_API_BASE_URL` - base URL for REST calls

### API (`apps/api/.env.example`)

- `API_PORT` - Spring Boot port
- `POSTGRES_*` - PostgreSQL connection settings
- `CORS_ALLOWED_ORIGINS` - comma-separated allowed origins for browser clients

> Spring Boot does not auto-load `apps/api/.env`. Use shell environment variables, defaults in
> `application.yml`, or pass variables from your process manager.

## Useful Scripts

- `npm run db:up` / `npm run db:down` - start/stop local PostgreSQL
- `npm run db:logs` - follow PostgreSQL logs
- `npm run dev:api` - run Spring Boot API
- `npm run dev:web` - build local packages and run Next.js
- `npm run build:packages` - rebuild workspace packages (`packages/*`)
- `npm run generate:sql --workspace @barops/demo-data` - generate realistic synthetic SQL seed (`infra/postgres/003__barops_seed_synthetic.sql`)

### Database Notes

- SQL schema and demo seed live in `infra/postgres/`.
- If you need to re-apply from scratch, reset the compose volume:
  - `docker compose down -v`
  - `npm run db:up`

## Demo-First Architecture Notes

- No production auth flow is implemented in this starter (by design).
- Risk scoring logic starts in `packages/rules-engine`.
- Synthetic signals live in `packages/demo-data`.
- Both web and API use the same domain language (`packages/shared-types` / mirrored Java records).
- Dashboard prefers API data from `NEXT_PUBLIC_API_BASE_URL` and falls back to local demo signals.
- PostgreSQL is wired for incremental persistence when demo needs evolve.

## Next Suggested Steps

- Add ingestion adapters for POS exports and Excel files.
- Add daily report job output using `packages/report-templates`.
- Add multi-tenant auth and RBAC only when moving beyond demo phase.
