
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Emails table
CREATE TABLE public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  preview TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  folder TEXT NOT NULL DEFAULT 'inbox',
  read BOOLEAN NOT NULL DEFAULT false,
  starred BOOLEAN NOT NULL DEFAULT false,
  has_attachment BOOLEAN NOT NULL DEFAULT false,
  labels TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_emails_sender ON public.emails(sender_id);
CREATE INDEX idx_emails_recipient ON public.emails(recipient_id);
CREATE INDEX idx_emails_folder ON public.emails(folder);

ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Helper function to check email ownership (avoids recursion)
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
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );
$$;

-- Users can see emails they sent or received
CREATE POLICY "Users can view their own emails"
  ON public.emails FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can insert emails where they are the sender
CREATE POLICY "Users can send emails"
  ON public.emails FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Users can update emails they own (star, read, move folder)
CREATE POLICY "Users can update their own emails"
  ON public.emails FOR UPDATE
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Users can delete their own emails
CREATE POLICY "Users can delete their own emails"
  ON public.emails FOR DELETE
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for emails
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
