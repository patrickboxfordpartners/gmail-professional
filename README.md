# mailBOXFORD

Smart email client for Boxford Partners with AI-powered features, CRM integration, and professional email management.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Edge Functions, Realtime, Storage)
- **AI:** Google Gemini via Generative Language API

## Getting Started

```sh
npm install
npm run dev
```

The dev server starts at `http://localhost:8080`.

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `.env` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` | Supabase anon/public key |
| `GOOGLE_AI_API_KEY` | Supabase secrets | Google Generative Language API key |

## Features

- Email inbox with folder management (inbox, sent, starred, drafts, archive, spam, trash)
- AI email summarization, smart replies, and compose assist
- Buying signal detection for sales teams
- CRM with contacts and companies
- Custom email signatures and templates
- Email import (EML, MBOX, CSV)
- Noise filter / unsubscribe suggestions
- Label management
- Scheduled send with undo
- Dark mode
- Mobile responsive

## Deployment

Deployed on Vercel. Push to `main` to trigger a deploy. The `vercel.json` SPA rewrite ensures client-side routes work on hard refresh.
