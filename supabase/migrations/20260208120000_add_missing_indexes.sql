-- Add missing indexes for common query patterns

-- contacts: filtered by user_id in CRM queries
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);

-- contacts: joined on company_id
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);

-- companies: filtered by user_id
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);

-- email_contacts: joined on email_id and contact_id (unique constraint exists but not a plain index)
CREATE INDEX IF NOT EXISTS idx_email_contacts_email_id ON public.email_contacts(email_id);
CREATE INDEX IF NOT EXISTS idx_email_contacts_contact_id ON public.email_contacts(contact_id);

-- sender_interactions: filtered by user_id
CREATE INDEX IF NOT EXISTS idx_sender_interactions_user_id ON public.sender_interactions(user_id);

-- labels: filtered by user_id
CREATE INDEX IF NOT EXISTS idx_labels_user_id ON public.labels(user_id);

-- emails: composite indexes for paginated inbox/sent queries
CREATE INDEX IF NOT EXISTS idx_emails_recipient_folder_created
  ON public.emails(recipient_id, folder, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emails_sender_folder_created
  ON public.emails(sender_id, folder, created_at DESC);
