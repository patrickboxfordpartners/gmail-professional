-- AI pipeline columns for the 4-stage xAI Grok scoring pipeline
ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS opportunity_score INTEGER,
  ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_classification TEXT,
  ADD COLUMN IF NOT EXISTS ai_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_processed_at TIMESTAMPTZ;

-- Track per-stage AI usage for cost monitoring
CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
