INSERT INTO outlet_peer_groups (id, code, name, city, zone, locality, notes)
VALUES
  ('af6a5de5-814a-4f14-a19c-3e3d744c3001', 'BLR-CBD-PREMIUM', 'CBD Premium Outlets', 'Bengaluru', 'Central', 'MG Road', 'High-value city-center peer group'),
  ('af6a5de5-814a-4f14-a19c-3e3d744c3002', 'BLR-WEST-HIGHST', 'West High Street Outlets', 'Bengaluru', 'West', 'Rajajinagar', 'High-footfall mixed license peer group')
ON CONFLICT (id) DO NOTHING;

INSERT INTO outlets (id, outlet_code, outlet_name, license_type, city, state, zone, locality, peer_group_id, opened_on)
VALUES
  ('a6f40d49-6bae-4f13-a20b-9b1375d8e101', 'BLR-CL9-001', 'MG Road Premium Spirits', 'CL9', 'Bengaluru', 'Karnataka', 'Central', 'MG Road', 'af6a5de5-814a-4f14-a19c-3e3d744c3001', '2023-01-10'),
  ('b3ed0a98-f6f8-4fe8-aea6-c407f90f43d0', 'BLR-CL7-014', 'Banashankari Cellars', 'CL7', 'Bengaluru', 'Karnataka', 'South', 'Banashankari', 'af6a5de5-814a-4f14-a19c-3e3d744c3002', '2022-07-15'),
  ('0e2f8f31-3968-4ea2-84aa-7bbfdb2152a8', 'BLR-CL2-022', 'Yelahanka Retail Depot', 'CL2', 'Bengaluru', 'Karnataka', 'North', 'Yelahanka', 'af6a5de5-814a-4f14-a19c-3e3d744c3002', '2021-11-05')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, sku, product_name, brand_name, category, pack_size_ml, abv_percent, mrp)
VALUES
  ('ef8cd15a-1d0b-4958-a66f-9b01444ea001', 'WHS-750-BLK01', 'Black Oak Reserve Whisky 750ml', 'Black Oak', 'Whisky', 750, 42.8, 1850.00),
  ('ef8cd15a-1d0b-4958-a66f-9b01444ea002', 'RUM-750-STM01', 'Storm Bay Dark Rum 750ml', 'Storm Bay', 'Rum', 750, 42.8, 1280.00),
  ('ef8cd15a-1d0b-4958-a66f-9b01444ea003', 'GIN-750-JUN01', 'Juniper Hills Gin 750ml', 'Juniper Hills', 'Gin', 750, 40.0, 1650.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, full_name, email, role, last_login_at)
VALUES
  ('d289fa0c-c50f-4d77-8fca-b74e154bb001', 'Demo HQ Admin', 'hq-admin@barops.demo', 'HQ_ADMIN', NOW() - INTERVAL '2 hours'),
  ('d289fa0c-c50f-4d77-8fca-b74e154bb002', 'Regional South Manager', 'south-manager@barops.demo', 'REGIONAL_MANAGER', NOW() - INTERVAL '1 day'),
  ('d289fa0c-c50f-4d77-8fca-b74e154bb003', 'Audit Reviewer', 'auditor@barops.demo', 'AUDITOR', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO uploads (
  id, outlet_id, upload_type, source, upload_date, status, file_name, checksum_sha256,
  uploaded_by_user_id, records_count, error_count, supersedes_upload_id, correction_note
)
VALUES
  ('f8e45f75-9861-4e2b-af40-f78e8d0ec001', 'a6f40d49-6bae-4f13-a20b-9b1375d8e101', 'DAILY_SALES', 'POS', '2026-04-14', 'PROCESSED', 'blr_cl9_001_sales_20260414.csv', 'sha256-demo-001', 'd289fa0c-c50f-4d77-8fca-b74e154bb002', 45, 0, NULL, NULL),
  ('f8e45f75-9861-4e2b-af40-f78e8d0ec002', 'a6f40d49-6bae-4f13-a20b-9b1375d8e101', 'DAILY_STOCK', 'EXCEL', '2026-04-14', 'PROCESSED', 'blr_cl9_001_stock_20260414.xlsx', 'sha256-demo-002', 'd289fa0c-c50f-4d77-8fca-b74e154bb002', 45, 0, NULL, NULL),
  ('f8e45f75-9861-4e2b-af40-f78e8d0ec003', 'b3ed0a98-f6f8-4fe8-aea6-c407f90f43d0', 'DAILY_STOCK', 'MANUAL_UPLOAD', '2026-04-14', 'CORRECTED', 'ban_cl7_014_stock_20260414_manual.csv', 'sha256-demo-003', 'd289fa0c-c50f-4d77-8fca-b74e154bb003', 40, 2, NULL, 'Initial file had closing stock typo'),
  ('f8e45f75-9861-4e2b-af40-f78e8d0ec004', 'b3ed0a98-f6f8-4fe8-aea6-c407f90f43d0', 'MANUAL_CORRECTION', 'MANUAL_UPLOAD', '2026-04-14', 'PROCESSED', 'ban_cl7_014_stock_20260414_correction.csv', 'sha256-demo-004', 'd289fa0c-c50f-4d77-8fca-b74e154bb003', 40, 0, 'f8e45f75-9861-4e2b-af40-f78e8d0ec003', 'Corrected closing units and signed off')
ON CONFLICT (id) DO NOTHING;

INSERT INTO daily_sales (
  id, outlet_id, product_id, sales_date, units_sold, gross_revenue, net_revenue, discount_amount, upload_id
)
VALUES
  ('2b190145-8f93-420d-bf5f-7fd370f55001', 'a6f40d49-6bae-4f13-a20b-9b1375d8e101', 'ef8cd15a-1d0b-4958-a66f-9b01444ea001', '2026-04-14', 32, 59200.00, 57500.00, 1700.00, 'f8e45f75-9861-4e2b-af40-f78e8d0ec001'),
  ('2b190145-8f93-420d-bf5f-7fd370f55002', 'b3ed0a98-f6f8-4fe8-aea6-c407f90f43d0', 'ef8cd15a-1d0b-4958-a66f-9b01444ea002', '2026-04-14', 28, 35840.00, 34900.00, 940.00, NULL),
  ('2b190145-8f93-420d-bf5f-7fd370f55003', '0e2f8f31-3968-4ea2-84aa-7bbfdb2152a8', 'ef8cd15a-1d0b-4958-a66f-9b01444ea003', '2026-04-14', 21, 34650.00, 34000.00, 650.00, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO daily_stock (
  id, outlet_id, product_id, stock_date, opening_units, inward_units, sold_units, actual_closing_units, upload_id
)
VALUES
  ('88f21b64-9468-4d13-939e-6f08dd7cb001', 'a6f40d49-6bae-4f13-a20b-9b1375d8e101', 'ef8cd15a-1d0b-4958-a66f-9b01444ea001', '2026-04-14', 140, 24, 32, 126, 'f8e45f75-9861-4e2b-af40-f78e8d0ec002'),
  ('88f21b64-9468-4d13-939e-6f08dd7cb002', 'b3ed0a98-f6f8-4fe8-aea6-c407f90f43d0', 'ef8cd15a-1d0b-4958-a66f-9b01444ea002', '2026-04-14', 110, 30, 28, 100, 'f8e45f75-9861-4e2b-af40-f78e8d0ec004'),
  ('88f21b64-9468-4d13-939e-6f08dd7cb003', '0e2f8f31-3968-4ea2-84aa-7bbfdb2152a8', 'ef8cd15a-1d0b-4958-a66f-9b01444ea003', '2026-04-14', 90, 18, 21, 86, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO anomalies (
  id, outlet_id, product_id, anomaly_date, rule_code, severity, status, risk_score_delta, summary,
  details, detected_from_upload_id
)
VALUES
  (
    '4a8c2ddf-5197-4e4a-bd2e-ecdc542f7001',
    'a6f40d49-6bae-4f13-a20b-9b1375d8e101',
    'ef8cd15a-1d0b-4958-a66f-9b01444ea001',
    '2026-04-14',
    'RULE_STOCK_VARIANCE_GT_3PCT',
    'HIGH',
    'OPEN',
    38,
    'Stock variance exceeds 3% threshold',
    '{"expectedClosingUnits":132,"actualClosingUnits":126,"variancePercent":-4.55,"peerMedianVariancePercent":-1.2}',
    'f8e45f75-9861-4e2b-af40-f78e8d0ec002'
  ),
  (
    '4a8c2ddf-5197-4e4a-bd2e-ecdc542f7002',
    'b3ed0a98-f6f8-4fe8-aea6-c407f90f43d0',
    'ef8cd15a-1d0b-4958-a66f-9b01444ea002',
    '2026-04-14',
    'RULE_UPLOAD_CORRECTION_CHAIN',
    'MEDIUM',
    'ACKNOWLEDGED',
    20,
    'Manual correction uploaded after initial stock file',
    '{"initialUploadErrors":2,"correctedBy":"auditor@barops.demo"}',
    'f8e45f75-9861-4e2b-af40-f78e8d0ec003'
  ),
  (
    '4a8c2ddf-5197-4e4a-bd2e-ecdc542f7003',
    '0e2f8f31-3968-4ea2-84aa-7bbfdb2152a8',
    'ef8cd15a-1d0b-4958-a66f-9b01444ea003',
    '2026-04-14',
    'RULE_PEER_DEVIATION_SALES_DROP',
    'LOW',
    'OPEN',
    9,
    'Sales below peer group trend for 2 consecutive days',
    '{"peerGroup":"BLR-WEST-HIGHST","dropPercentVsPeer":8.7}',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO executive_summaries (
  id, week_start_date, week_end_date, scope_type, scope_ref_id, generated_by_user_id,
  total_outlets, high_risk_outlets, medium_risk_outlets, top_findings, recommended_actions, narrative
)
VALUES
  (
    '8bbba667-74d7-4db2-a20c-9f5deef61001',
    '2026-04-13',
    '2026-04-19',
    'CITY',
    NULL,
    'd289fa0c-c50f-4d77-8fca-b74e154bb001',
    3,
    1,
    1,
    '[
      {"ruleCode":"RULE_STOCK_VARIANCE_GT_3PCT","outletCode":"BLR-CL9-001","impact":"high"},
      {"ruleCode":"RULE_UPLOAD_CORRECTION_CHAIN","outletCode":"BLR-CL7-014","impact":"medium"}
    ]'::jsonb,
    '[
      {"priority":1,"action":"Trigger stock recount at BLR-CL9-001"},
      {"priority":2,"action":"Monitor correction frequency in South zone"}
    ]'::jsonb,
    'Bengaluru weekly view shows one high-risk outlet driven by stock variance and one medium-risk outlet requiring correction monitoring.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (
  id, entity_type, entity_id, action, actor_user_id, source, request_id, before_state, after_state, notes
)
VALUES
  (
    '7cf8c234-77f3-427b-b8f0-2a2ad01e9001',
    'uploads',
    'f8e45f75-9861-4e2b-af40-f78e8d0ec004',
    'CREATE_CORRECTION_UPLOAD',
    'd289fa0c-c50f-4d77-8fca-b74e154bb003',
    'API',
    'req-demo-0001',
    '{"status":"CORRECTED"}'::jsonb,
    '{"status":"PROCESSED","supersedesUploadId":"f8e45f75-9861-4e2b-af40-f78e8d0ec003"}'::jsonb,
    'Correction chain recorded for audit trail'
  ),
  (
    '7cf8c234-77f3-427b-b8f0-2a2ad01e9002',
    'anomalies',
    '4a8c2ddf-5197-4e4a-bd2e-ecdc542f7002',
    'STATUS_CHANGE',
    'd289fa0c-c50f-4d77-8fca-b74e154bb003',
    'SCRIPT',
    'seed-script',
    '{"status":"OPEN"}'::jsonb,
    '{"status":"ACKNOWLEDGED"}'::jsonb,
    'Seeded example of acknowledgement workflow'
  )
ON CONFLICT (id) DO NOTHING;
