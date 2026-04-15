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
     - `Copy-Item apps/api/.env.example apps/api/.env`
   - macOS/Linux:
     - `cp .env.example .env`
     - `cp apps/web/.env.example apps/web/.env.local`
     - `cp apps/api/.env.example apps/api/.env`
2. Start PostgreSQL:
   - `docker compose up -d`
3. Install JS dependencies:
   - `npm install`
4. Build local shared packages:
   - `npm run build:packages`
5. Start the API (from `apps/api`):
   - `gradle bootRun`
6. Start the web app (from repo root):
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
- `NEXT_PUBLIC_API_BASE_URL`

### Web (`apps/web/.env.example`)

- `NEXT_PUBLIC_API_BASE_URL` - base URL for REST calls

### API (`apps/api/.env.example`)

- `API_PORT` - Spring Boot port
- `POSTGRES_*` - PostgreSQL connection settings

## Demo-First Architecture Notes

- No production auth flow is implemented in this starter (by design).
- Risk scoring logic starts in `packages/rules-engine`.
- Synthetic signals live in `packages/demo-data`.
- Both web and API use the same domain language (`packages/shared-types` / mirrored Java records).
- PostgreSQL is wired for incremental persistence when demo needs evolve.

## Next Suggested Steps

- Add ingestion adapters for POS exports and Excel files.
- Add daily report job output using `packages/report-templates`.
- Add multi-tenant auth and RBAC only when moving beyond demo phase.
