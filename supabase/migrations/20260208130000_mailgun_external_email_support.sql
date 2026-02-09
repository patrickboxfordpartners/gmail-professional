-- Migration: Support external senders/recipients via Mailgun
-- Allows emails to/from addresses that are NOT app users (no profile row).

-- 1. Add new columns for external email addresses and names
ALTER TABLE public.emails
  ADD COLUMN sender_email TEXT,
  ADD COLUMN recipient_email TEXT,
  ADD COLUMN sender_name TEXT,
  ADD COLUMN recipient_name TEXT,
  ADD COLUMN mailgun_message_id TEXT;

-- 2. Create unique index on mailgun_message_id for deduplication
CREATE UNIQUE INDEX idx_emails_mailgun_message_id
  ON public.emails(mailgun_message_id) WHERE mailgun_message_id IS NOT NULL;

-- 3. Backfill sender_email and recipient_email from profiles
UPDATE public.emails e
  SET sender_email = p.email
  FROM public.profiles p
  WHERE e.sender_id = p.id AND e.sender_email IS NULL;

UPDATE public.emails e
  SET recipient_email = p.email
  FROM public.profiles p
  WHERE e.recipient_id = p.id AND e.recipient_email IS NULL;

-- 4. Make sender_id and recipient_id nullable (drop NOT NULL + FK, recreate FK without NOT NULL)
ALTER TABLE public.emails
  DROP CONSTRAINT emails_sender_id_fkey,
  DROP CONSTRAINT emails_recipient_id_fkey;

ALTER TABLE public.emails
  ALTER COLUMN sender_id DROP NOT NULL,
  ALTER COLUMN recipient_id DROP NOT NULL;

ALTER TABLE public.emails
  ADD CONSTRAINT emails_sender_id_fkey
    FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT emails_recipient_id_fkey
    FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. CHECK constraints: at least one identifier must be set for sender and recipient
ALTER TABLE public.emails
  ADD CONSTRAINT chk_sender_identified
    CHECK (sender_id IS NOT NULL OR sender_email IS NOT NULL),
  ADD CONSTRAINT chk_recipient_identified
    CHECK (recipient_id IS NOT NULL OR recipient_email IS NOT NULL);

-- 6. Indexes on email address columns for query performance
CREATE INDEX idx_emails_sender_email ON public.emails(sender_email);
CREATE INDEX idx_emails_recipient_email ON public.emails(recipient_email);

-- 7. Update RLS policies to also match on email address
--    First, we need a function to get the current user's email from profiles
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop and recreate email policies to include email-address matching
DROP POLICY IF EXISTS "Users can view their own emails" ON public.emails;
CREATE POLICY "Users can view their own emails"
  ON public.emails FOR SELECT
  USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR sender_email = public.current_user_email()
    OR recipient_email = public.current_user_email()
  );

DROP POLICY IF EXISTS "Users can send emails" ON public.emails;
CREATE POLICY "Users can send emails"
  ON public.emails FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    OR sender_email = public.current_user_email()
  );

DROP POLICY IF EXISTS "Users can update their own emails" ON public.emails;
CREATE POLICY "Users can update their own emails"
  ON public.emails FOR UPDATE
  USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR sender_email = public.current_user_email()
    OR recipient_email = public.current_user_email()
  );

DROP POLICY IF EXISTS "Users can delete their own emails" ON public.emails;
CREATE POLICY "Users can delete their own emails"
  ON public.emails FOR DELETE
  USING (
    sender_id = auth.uid()
    OR recipient_id = auth.uid()
    OR sender_email = public.current_user_email()
    OR recipient_email = public.current_user_email()
  );

-- Allow service_role (edge functions) to insert emails for external senders
-- Edge functions use the service_role key which bypasses RLS, so no extra policy needed.

-- 8. Update helper functions to also match on email address
CREATE OR REPLACE FUNCTION public.is_email_owner(_email_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.emails
    WHERE id = _email_id
      AND (
        sender_id = auth.uid()
        OR recipient_id = auth.uid()
        OR sender_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        OR recipient_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_owns_email(_email_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.emails
    WHERE id = _email_id
      AND (
        sender_id = auth.uid()
        OR recipient_id = auth.uid()
        OR sender_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        OR recipient_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
      )
  );
$$;
