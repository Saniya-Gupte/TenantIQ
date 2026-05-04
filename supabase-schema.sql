-- TenantIQ Supabase Schema
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  applicant_name TEXT NOT NULL,
  applicant_email TEXT,
  application_data JSONB,
  agent_results JSONB,
  overall_score INTEGER DEFAULT 0,
  recommendation TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'processing'
);

-- Enable Row Level Security (optional for MVP)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Allow all operations for service role (used by API routes)
CREATE POLICY "Service role full access" ON applications
  FOR ALL USING (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_recommendation ON applications(recommendation);
