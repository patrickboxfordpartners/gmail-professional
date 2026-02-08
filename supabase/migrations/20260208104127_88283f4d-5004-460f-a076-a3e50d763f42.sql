
-- Labels table (user-owned custom labels with colors)
CREATE TABLE public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own labels"
  ON public.labels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own labels"
  ON public.labels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own labels"
  ON public.labels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own labels"
  ON public.labels FOR DELETE
  USING (auth.uid() = user_id);

-- Junction table: email <-> label
CREATE TABLE public.email_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  UNIQUE(email_id, label_id)
);

CREATE INDEX idx_email_labels_email ON public.email_labels(email_id);
CREATE INDEX idx_email_labels_label ON public.email_labels(label_id);

ALTER TABLE public.email_labels ENABLE ROW LEVEL SECURITY;

-- Security definer to check email ownership without recursion
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
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
  );
$$;

CREATE POLICY "Users can view labels on their emails"
  ON public.email_labels FOR SELECT
  USING (public.user_owns_email(email_id));

CREATE POLICY "Users can add labels to their emails"
  ON public.email_labels FOR INSERT
  WITH CHECK (public.user_owns_email(email_id));

CREATE POLICY "Users can remove labels from their emails"
  ON public.email_labels FOR DELETE
  USING (public.user_owns_email(email_id));

-- Enable realtime for labels
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_labels;
