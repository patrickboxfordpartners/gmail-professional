# mailBOXFORD — Project Memory

## Architecture Decisions

### Email delivery: Mailgun on boxfordpartners.com (Feb 2026)

We built real send/receive email via Mailgun rather than just inserting rows in the DB.

**Key design choices:**

- **Provider-agnostic schema.** `sender_id`/`recipient_id` (profile FKs) are nullable. Every email also carries `sender_email`, `recipient_email`, `sender_name`, `recipient_name` as plain TEXT. This means the data model doesn't care *how* the email was delivered — Mailgun, SendGrid, SES, or a future provider all just populate the same columns. The `mailgun_message_id` column is provider-specific but isolated; swapping providers means adding a new column (or renaming), not restructuring the table.

- **Edge functions as the integration seam.** `mailgun-send` and `mailgun-inbound` are the only places that touch the Mailgun API. The frontend calls `supabase.functions.invoke("mailgun-send")` and never knows about Mailgun directly. Swapping to a different provider = rewrite those two functions, nothing else changes.

- **External participants are first-class.** The schema, RLS policies, helper functions (`is_email_owner`, `user_owns_email`), and frontend queries all match on email address in addition to user UUID. External people who email in have no profile row and that's fine.

- **Inbound dedup via `mailgun_message_id` unique index.** Mailgun can retry webhook delivery; the unique partial index on `mailgun_message_id` silently drops duplicates at the DB level (Postgres error code 23505).

- **Inbound webhook auth: HMAC-SHA256.** The `mailgun-inbound` function verifies the Mailgun signature using `crypto.subtle` before processing anything. Rejects with 403 on bad signatures.

**Files involved:**
- `supabase/migrations/20260208130000_mailgun_external_email_support.sql` — schema changes
- `supabase/functions/mailgun-send/index.ts` — outbound delivery
- `supabase/functions/mailgun-inbound/index.ts` — inbound webhook receiver
- `src/hooks/useEmails.ts` — frontend hook (calls edge function, handles external participants)
- `src/integrations/supabase/types.ts` — DB types (nullable IDs, new columns)

**Secrets required:** `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_WEBHOOK_SIGNING_KEY`

### Why this matters for future provider swaps

The thinking: as AI gets embedded deeper into business workflows, companies will want to stay agnostic across vendors — email providers, AI models, auth systems. The pattern here (provider-specific logic isolated in edge functions, provider-agnostic schema, frontend that only knows about the app's own API) is the template for how we should integrate any external service going forward. The schema should describe *what happened* (an email was sent/received), not *how it happened* (via Mailgun).
