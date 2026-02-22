-- Cc, Bcc, and attachment metadata for outbound emails
ALTER TABLE emails
  ADD COLUMN IF NOT EXISTS cc TEXT,
  ADD COLUMN IF NOT EXISTS bcc TEXT,
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
