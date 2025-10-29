-- Entrada Guardianship Forms Database Setup
-- Run this in your Supabase SQL Editor after getting your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the main cases table
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'generated')),
  form_data JSONB NOT NULL DEFAULT '{}',
  last_section_completed TEXT,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  generated_pdfs JSONB DEFAULT '{}',
  minor_name TEXT GENERATED ALWAYS AS (form_data->>'minor_name') STORED,
  notes TEXT,
  supporting_docs JSONB DEFAULT '{}',
  collaborators JSONB DEFAULT '[]'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cases_user_email ON cases(user_email);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_updated_at ON cases(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_minor_name ON cases(minor_name);

-- Enable Row Level Security
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own cases" ON cases;

-- Create RLS policy - users can only see/modify their own cases
CREATE POLICY "Users can manage their own cases" ON cases
  FOR ALL
  USING (user_email = auth.email())
  WITH CHECK (user_email = auth.email());

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS set_updated_at ON cases;

-- Create the trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create a function to calculate completion percentage
CREATE OR REPLACE FUNCTION calculate_completion_percentage(form_data JSONB)
RETURNS INTEGER AS $$
DECLARE
  total_fields INTEGER := 95; -- Total important fields across all sections
  completed_fields INTEGER := 0;
  percentage INTEGER;
BEGIN
  -- Count non-empty fields
  SELECT COUNT(*) INTO completed_fields
  FROM jsonb_each_text(form_data)
  WHERE value IS NOT NULL
    AND value != ''
    AND value != 'null';

  -- Calculate percentage
  percentage := LEAST(100, (completed_fields * 100 / total_fields));

  RETURN percentage;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing (optional)
-- This will only work after authentication is set up
-- INSERT INTO cases (user_email, form_data, status, completion_percentage) VALUES
-- ('test@example.com', '{"minor_name": "Test Child", "minor_dob": "2010-01-01"}', 'draft', 15);

-- Grant necessary permissions
GRANT ALL ON cases TO authenticated;
GRANT ALL ON cases TO service_role;

-- Create a view for case summaries (useful for dashboard)
CREATE OR REPLACE VIEW case_summaries AS
SELECT
  id,
  minor_name,
  status,
  completion_percentage,
  created_at,
  updated_at,
  last_section_completed,
  user_email,
  jsonb_object_keys(form_data) as completed_fields_count
FROM cases;

-- Grant access to the view
GRANT SELECT ON case_summaries TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Entrada database setup completed successfully!';
  RAISE NOTICE 'Tables created: cases';
  RAISE NOTICE 'RLS enabled with user-scoped access';
  RAISE NOTICE 'Auto-save triggers configured';
  RAISE NOTICE 'Ready to connect from Next.js app';
END $$;