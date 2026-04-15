CREATE TABLE IF NOT EXISTS outlet_signal (
  id UUID PRIMARY KEY,
  outlet_code TEXT NOT NULL UNIQUE,
  outlet_name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  date DATE NOT NULL,
  risk_score INTEGER NOT NULL,
  reasons TEXT NOT NULL
);
