# Demo Data Generator

This package now includes a deterministic Python generator that creates realistic synthetic SQL seed data aligned to the existing BarOps Authority PostgreSQL schema.

## What It Generates

- 30 Bengaluru outlets across `CL2`, `CL7`, `CL9`
- 180 operational days (`2025-10-23` to `2026-04-20`)
- 540 liquor SKUs (mixed categories, pack sizes, pricing bands)
- Daily records aligned to schema tables:
  - `outlet_peer_groups`
  - `outlets`
  - `products`
  - `users`
  - `uploads`
  - `daily_sales`
  - `daily_stock`
  - `anomalies`
  - `executive_summaries`
  - `audit_logs`

## Deterministic Output

- Default random seed: `20260421`
- Re-running with the same seed reproduces identical UUIDs and values.
- UUIDs are generated deterministically (`uuid5`) so references stay stable.

## Run

From repo root:

```bash
npm run generate:sql --workspace @barops/demo-data
```

Or directly:

```bash
python packages/demo-data/scripts/generate_synthetic_demo.py
```

By default, output is written to:

- `infra/postgres/003__barops_seed_synthetic.sql`

Optional custom output and seed:

```bash
python packages/demo-data/scripts/generate_synthetic_demo.py --output infra/postgres/generated/demo_seed.sql --seed 20260421
```

## Reload In PostgreSQL

Use your existing DB container:

```bash
docker compose exec -T postgres psql -U barops -d barops_authority < infra/postgres/003__barops_seed_synthetic.sql
```

Or full reset + init scripts:

```bash
docker compose down -v
npm run db:up
docker compose exec -T postgres psql -U barops -d barops_authority < infra/postgres/003__barops_seed_synthetic.sql
```

## Pattern Design Highlights

The generator includes realistic management-demo signals:

- Peer-group behavior differences by zone and market profile
- Weekday/weekend and monthly seasonality effects
- Premium vs non-premium outlet sales mix differences
- Inventory flow realism: opening stock, inward, sold, reported closing
- Upload process realism: on-time vs late, missing days, correction chains
- Injected risk/anomaly patterns:
  - stock mismatch
  - repeated late uploads
  - suspicious correction chains
  - own-baseline deviation
  - peer-group deviation
  - premium mix spike
  - sudden drop in top-selling brand
  - risk accumulation over 180 days

## Extend for Client-Specific Demos Later

Recommended extension points in `scripts/generate_synthetic_demo.py`:

- `build_outlets()` for city/license/outlet network customization
- `build_products()` for client brand catalog mapping
- `month_factor()` and `weekday_factor()` for local seasonality profiles
- risk tier probabilities and special cohorts for narrative control
- rule thresholds (`RULE_*`) to mirror client policy tolerances

For multi-city or client-tailored demos, add a YAML/JSON config layer and feed the generator from external scenario files instead of hard-coded distributions.
