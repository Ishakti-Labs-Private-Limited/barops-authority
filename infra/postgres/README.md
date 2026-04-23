# BarOps Authority PostgreSQL Design

This folder now contains an idempotent, demo-first PostgreSQL setup:

- `001__barops_schema.sql` - core schema (10 requested tables + helper view)
- `002__barops_seed_demo.sql` - starter demo data
- `init.sql` - bootstrap marker (kept for compatibility)

## Design Goals

- Fast demo iteration for management review workflows
- Clear table names and predictable keys (UUID-first)
- Strong enough audit trail for correction history
- Minimal auth complexity (simple role-based users table)
- Practical denormalization where it helps speed and readability

## Core Tables and Why

1. `outlets`
   - Master list of stores with `license_type` (`CL2`/`CL7`/`CL9`), `zone`, `locality`
   - Supports Bengaluru segmentation and regional filtering
2. `outlet_peer_groups`
   - Benchmark cohorts for peer comparison (by zone/locality/format)
3. `products`
   - Product catalog for daily stock/sales joins
4. `daily_sales`
   - Daily outlet-product sales facts
5. `daily_stock`
   - Daily outlet-product stock snapshot with generated variance columns
6. `uploads`
   - Ingestion metadata + correction chaining (`supersedes_upload_id`)
7. `anomalies`
   - Rule-based findings with severity, status, and `risk_score_delta`
8. `executive_summaries`
   - Weekly management roll-ups (city/zone/peer/outlet scope)
9. `audit_logs`
   - Entity-level before/after JSON snapshots for traceability
10. `users`
   - Lightweight demo roles (`HQ_ADMIN`, `REGIONAL_MANAGER`, `AUDITOR`, `DEMO_VIEWER`)

## Keys, Relationships, and Constraints

- **Primary keys**: UUID on all tables (`gen_random_uuid()`)
- **Time columns**:
  - `created_at` on all business tables
  - `updated_at` + update trigger for mutable tables
- **Important relationships**:
  - `outlets.peer_group_id -> outlet_peer_groups.id`
  - `daily_sales.outlet_id -> outlets.id`
  - `daily_sales.product_id -> products.id`
  - `daily_stock.outlet_id -> outlets.id`
  - `daily_stock.product_id -> products.id`
  - `uploads.outlet_id -> outlets.id`
  - `uploads.supersedes_upload_id -> uploads.id` (correction chain)
  - `anomalies.outlet_id -> outlets.id`
  - `anomalies.product_id -> products.id`
  - `anomalies.detected_from_upload_id -> uploads.id`
  - `audit_logs.actor_user_id -> users.id`
- **Data safety constraints**:
  - License type, roles, status values via `CHECK` constraints
  - Non-negative sales/stock values
  - Unique daily grain in facts:
    - `daily_sales (outlet_id, product_id, sales_date)`
    - `daily_stock (outlet_id, product_id, stock_date)`

## Risk Scoring and Variance Support

- `daily_stock` includes generated:
  - `expected_closing_units`
  - `variance_units`
  - `variance_percent`
- `anomalies.risk_score_delta` stores rule impact at detection time
- `v_outlet_daily_risk` view provides daily outlet risk roll-up for API dashboards

## Index Strategy (Practical Demo Set)

- Filtering:
  - `outlets(city, zone, license_type)`
  - `uploads(upload_date, status)`
  - `anomalies(anomaly_date, outlet_id)` and `(status, severity)`
- Time-series lookups:
  - `daily_sales(sales_date, outlet_id)`
  - `daily_stock(stock_date, outlet_id)`
- Audit/JSON:
  - `audit_logs(entity_type, entity_id)`
  - `anomalies.details` GIN index for JSON diagnostics

## Seed Data Coverage

`002__barops_seed_demo.sql` includes:

- 2 peer groups
- 3 Bengaluru outlets (CL2, CL7, CL9)
- 3 products
- 3 users with demo roles
- upload and correction chain sample
- daily sales and stock records
- rule-based anomalies
- weekly executive summary
- audit log entries

## Optional CSV Seed Structure (for bulk demos)

If you want CSV-driven loading, keep files under `infra/postgres/seeds/`:

- `outlets.csv`
- `products.csv`
- `daily_sales.csv`
- `daily_stock.csv`
- `uploads.csv`
- `anomalies.csv`

Recommended header examples:

```csv
id,outlet_code,outlet_name,license_type,city,state,zone,locality,peer_group_id,opened_on,is_active
```

```csv
id,outlet_id,product_id,stock_date,opening_units,inward_units,sold_units,actual_closing_units,upload_id
```
