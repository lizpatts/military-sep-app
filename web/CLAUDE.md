# CLAUDE.md

## Project Context
Military separation app helping active duty members transition to civilian life, built with Next.js (web), Supabase (backend/auth), and deployed on Vercel.

## Code Style Preferences
- JavaScript only (no TypeScript)
- Inline styles over CSS modules or Tailwind (already established pattern)
- All colors use the dark navy theme: background `#0a1628`, cards `#0f2035`, borders `#1e3a5f`, text-muted `#8899aa`, text-faint `#445566`
- Accent colors: blue `#2563eb`, green `#22c55e`, amber `#f59e0b`, red `#ef4444`
- All Supabase calls use `../../lib/supabase` (browser client) or `@supabase/ssr` (server/API routes)
- API routes live in `app/api/` and use Next.js Route Handlers (not pages/api)
- No TypeScript, no Prisma, no tRPC
- Keep components in single files — no separate CSS or JS files per component
- All UUIDs in database tables (never bigint for primary keys)

## Commands
```bash
npm run dev          # Start local dev server at localhost:3000
npm run build        # Build for production
git add . && git commit -m "message" && git push   # Push to GitHub (auto-deploys to Vercel)
```

## Architecture Decisions
- **Auth**: Supabase Google OAuth with PKCE flow via `/app/auth/callback/route.js`. Session stored in cookies via `@supabase/ssr`. No Apple login yet (pending $99 developer account).
- **Database**: Supabase PostgreSQL. All tables use UUID primary keys. RLS enabled on all tables with per-user policies. Key tables: `profiles`, `checklist_items`, `user_checklist_progress`, `user_custom_tasks`, `certifications`, `cert_favorites`, `skillbridge_locations`, `skillbridge_favorites`, `blog_posts`, `notification_log`.
- **Notifications**: Resend for email (`/app/api/notifications/email/route.js`). Vercel cron job runs daily at 9am UTC via `vercel.json` hitting `/api/notifications/schedule`. SMS (Twilio) and push notifications not yet implemented.
- **Maps**: Google Maps JavaScript API loaded dynamically in `/app/skillbridge/page.js`. SkillBridge locations stored in Supabase, not pulled from live DoD source yet.
- **Calculators**: Client-side only (no API calls). TSP calculator includes BRS military match, separation age, inflation adjustment, and Chart.js growth chart. GI Bill uses approximate 2024 BAH rates by state.
- **Checklist priority**: Items have `priority` field (`normal`, `high`, `critical`). Users within 365 days of separation see high/critical items only. Hidden items excluded from progress % unless completed.
- **Progress tracking**: Dashboard and checklist both calculate progress as completed/(total - hidden_uncompleted). Custom tasks counted separately via `user_custom_tasks`.
- **Blog**: Posts stored in Supabase `blog_posts` table. Admin publishes via Supabase Table Editor. Individual posts at `/blog/[slug]`.
- **Environment variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` — all must be set in both `.env.local` and Vercel dashboard.