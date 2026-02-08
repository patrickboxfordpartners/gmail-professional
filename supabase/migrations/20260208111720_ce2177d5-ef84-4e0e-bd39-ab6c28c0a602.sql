
-- Email signatures table
CREATE TABLE public.email_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default',
  is_default BOOLEAN NOT NULL DEFAULT false,
  full_name TEXT NOT NULL DEFAULT '',
  job_title TEXT DEFAULT '',
  company TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  twitter TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  font_family TEXT DEFAULT 'Arial, sans-serif',
  primary_color TEXT DEFAULT '#1a1a1a',
  secondary_color TEXT DEFAULT '#666666',
  accent_color TEXT DEFAULT '#4f46e5',
  layout TEXT DEFAULT 'horizontal',
  custom_html TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signatures" ON public.email_signatures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own signatures" ON public.email_signatures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own signatures" ON public.email_signatures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own signatures" ON public.email_signatures FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_email_signatures_updated_at BEFORE UPDATE ON public.email_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email templates table
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON public.email_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own templates" ON public.email_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.email_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.email_templates FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add scheduled_at column to emails table for schedule send
ALTER TABLE public.emails ADD COLUMN scheduled_at TIMESTAMPTZ DEFAULT NULL;

-- Storage bucket for signature assets
INSERT INTO storage.buckets (id, name, public) VALUES ('signature-assets', 'signature-assets', true);

CREATE POLICY "Users can upload own signature assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'signature-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own signature assets" ON storage.objects FOR UPDATE
  USING (bucket_id = 'signature-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own signature assets" ON storage.objects FOR DELETE
  USING (bucket_id = 'signature-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Signature assets are publicly readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'signature-assets');
