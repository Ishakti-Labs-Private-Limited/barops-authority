CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS outlet_peer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  zone TEXT NOT NULL,
  locality TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_code TEXT NOT NULL UNIQUE,
  outlet_name TEXT NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('CL2', 'CL7', 'CL9')),
  city TEXT NOT NULL DEFAULT 'Bengaluru',
  state TEXT NOT NULL DEFAULT 'Karnataka',
  zone TEXT NOT NULL,
  locality TEXT NOT NULL,
  peer_group_id UUID REFERENCES outlet_peer_groups(id) ON DELETE SET NULL,
  opened_on DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  category TEXT NOT NULL,
  pack_size_ml INTEGER NOT NULL CHECK (pack_size_ml > 0),
  abv_percent NUMERIC(5, 2),
  mrp NUMERIC(12, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('HQ_ADMIN', 'REGIONAL_MANAGER', 'AUDITOR', 'DEMO_VIEWER')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID REFERENCES outlets(id) ON DELETE SET NULL,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('DAILY_SALES', 'DAILY_STOCK', 'MANUAL_CORRECTION')),
  source TEXT NOT NULL CHECK (source IN ('POS', 'EXCEL', 'MANUAL_UPLOAD')),
  upload_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('RECEIVED', 'PROCESSED', 'FAILED', 'CORRECTED')),
  file_name TEXT,
  checksum_sha256 TEXT,
  uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  records_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  supersedes_upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  correction_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  sales_date DATE NOT NULL,
  units_sold INTEGER NOT NULL DEFAULT 0 CHECK (units_sold >= 0),
  gross_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (gross_revenue >= 0),
  net_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (net_revenue >= 0),
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (outlet_id, product_id, sales_date)
);

CREATE TABLE IF NOT EXISTS daily_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  stock_date DATE NOT NULL,
  opening_units INTEGER NOT NULL DEFAULT 0 CHECK (opening_units >= 0),
  inward_units INTEGER NOT NULL DEFAULT 0 CHECK (inward_units >= 0),
  sold_units INTEGER NOT NULL DEFAULT 0 CHECK (sold_units >= 0),
  expected_closing_units INTEGER GENERATED ALWAYS AS (opening_units + inward_units - sold_units) STORED,
  actual_closing_units INTEGER NOT NULL DEFAULT 0 CHECK (actual_closing_units >= 0),
  variance_units INTEGER GENERATED ALWAYS AS (actual_closing_units - (opening_units + inward_units - sold_units)) STORED,
  variance_percent NUMERIC(7, 2) GENERATED ALWAYS AS (
    CASE
      WHEN (opening_units + inward_units - sold_units) = 0 THEN 0
      ELSE ROUND(((actual_closing_units - (opening_units + inward_units - sold_units))::NUMERIC
        / NULLIF((opening_units + inward_units - sold_units), 0)::NUMERIC) * 100, 2)
    END
  ) STORED,
  upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (outlet_id, product_id, stock_date)
);

CREATE TABLE IF NOT EXISTS anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  anomaly_date DATE NOT NULL,
  rule_code TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE')),
  risk_score_delta INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  detected_from_upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
  resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS executive_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('CHAIN', 'CITY', 'ZONE', 'PEER_GROUP', 'OUTLET')),
  scope_ref_id UUID,
  generated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_outlets INTEGER NOT NULL DEFAULT 0,
  high_risk_outlets INTEGER NOT NULL DEFAULT 0,
  medium_risk_outlets INTEGER NOT NULL DEFAULT 0,
  top_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  narrative TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (week_end_date >= week_start_date),
  UNIQUE (week_start_date, week_end_date, scope_type, scope_ref_id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL CHECK (source IN ('API', 'SYSTEM', 'SCRIPT')),
  request_id TEXT,
  before_state JSONB,
  after_state JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outlets_city_zone_license
  ON outlets (city, zone, license_type);
CREATE INDEX IF NOT EXISTS idx_outlets_peer_group_id
  ON outlets (peer_group_id);

CREATE INDEX IF NOT EXISTS idx_products_brand_category
  ON products (brand_name, category);

CREATE INDEX IF NOT EXISTS idx_uploads_upload_date_status
  ON uploads (upload_date, status);
CREATE INDEX IF NOT EXISTS idx_uploads_outlet_id
  ON uploads (outlet_id);
CREATE INDEX IF NOT EXISTS idx_uploads_supersedes_upload_id
  ON uploads (supersedes_upload_id);

CREATE INDEX IF NOT EXISTS idx_daily_sales_date_outlet
  ON daily_sales (sales_date, outlet_id);

CREATE INDEX IF NOT EXISTS idx_daily_stock_date_outlet
  ON daily_stock (stock_date, outlet_id);
CREATE INDEX IF NOT EXISTS idx_daily_stock_variance
  ON daily_stock (stock_date, variance_percent);

CREATE INDEX IF NOT EXISTS idx_anomalies_date_outlet
  ON anomalies (anomaly_date, outlet_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_status_severity
  ON anomalies (status, severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_rule_code
  ON anomalies (rule_code);
CREATE INDEX IF NOT EXISTS idx_anomalies_details_gin
  ON anomalies USING GIN (details);

CREATE INDEX IF NOT EXISTS idx_executive_summaries_week_scope
  ON executive_summaries (week_start_date, week_end_date, scope_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

CREATE OR REPLACE VIEW v_outlet_daily_risk AS
SELECT
  a.outlet_id,
  a.anomaly_date AS risk_date,
  GREATEST(0, LEAST(100, COALESCE(SUM(a.risk_score_delta), 0))) AS risk_score,
  COUNT(*) FILTER (WHERE a.severity IN ('HIGH', 'CRITICAL')) AS high_severity_count
FROM anomalies a
GROUP BY a.outlet_id, a.anomaly_date;

CREATE TRIGGER trg_outlet_peer_groups_set_updated_at
BEFORE UPDATE ON outlet_peer_groups
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_outlets_set_updated_at
BEFORE UPDATE ON outlets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_set_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_uploads_set_updated_at
BEFORE UPDATE ON uploads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_daily_sales_set_updated_at
BEFORE UPDATE ON daily_sales
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_daily_stock_set_updated_at
BEFORE UPDATE ON daily_stock
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_anomalies_set_updated_at
BEFORE UPDATE ON anomalies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_executive_summaries_set_updated_at
BEFORE UPDATE ON executive_summaries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
