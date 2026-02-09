-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add sender_email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'emails'
                   AND column_name = 'sender_email') THEN
        ALTER TABLE public.emails ADD COLUMN sender_email TEXT;
    END IF;

    -- Add recipient_email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'emails'
                   AND column_name = 'recipient_email') THEN
        ALTER TABLE public.emails ADD COLUMN recipient_email TEXT;
    END IF;

    -- Add sender_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'emails'
                   AND column_name = 'sender_name') THEN
        ALTER TABLE public.emails ADD COLUMN sender_name TEXT;
    END IF;

    -- Add recipient_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'emails'
                   AND column_name = 'recipient_name') THEN
        ALTER TABLE public.emails ADD COLUMN recipient_name TEXT;
    END IF;

    -- Add mailgun_message_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'emails'
                   AND column_name = 'mailgun_message_id') THEN
        ALTER TABLE public.emails ADD COLUMN mailgun_message_id TEXT;
    END IF;
END $$;

-- Create unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_mailgun_message_id
  ON public.emails(mailgun_message_id) WHERE mailgun_message_id IS NOT NULL;

-- Backfill sender_email and recipient_email from profiles if not already set
UPDATE public.emails e
  SET sender_email = p.email
  FROM public.profiles p
  WHERE e.sender_id = p.id AND e.sender_email IS NULL;

UPDATE public.emails e
  SET recipient_email = p.email
  FROM public.profiles p
  WHERE e.recipient_id = p.id AND e.recipient_email IS NULL;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_emails_sender_email ON public.emails(sender_email);
CREATE INDEX IF NOT EXISTS idx_emails_recipient_email ON public.emails(recipient_email);
