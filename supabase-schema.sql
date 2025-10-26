-- Supabase Schema for SmartSpend

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  "submittedBy" TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  "approvedBy" TEXT,
  "approvedDate" DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create authenticated expenses table (for authenticated mode)
CREATE TABLE IF NOT EXISTS auth_expenses (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  "submittedBy" TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL,
  "approvedBy" TEXT,
  "approvedDate" DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON expenses("submittedBy");
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_department ON expenses(department);

CREATE INDEX IF NOT EXISTS idx_auth_expenses_submitted_by ON auth_expenses("submittedBy");
CREATE INDEX IF NOT EXISTS idx_auth_expenses_status ON auth_expenses(status);
CREATE INDEX IF NOT EXISTS idx_auth_expenses_department ON auth_expenses(department);

-- Enable Row Level Security (RLS) - we'll handle auth at app level
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (we handle auth in the app)
CREATE POLICY "Allow all operations" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON auth_expenses FOR ALL USING (true) WITH CHECK (true);

