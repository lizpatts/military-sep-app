Military Separation App — CLAUDE.md
Project Info
Live: https://military-sep-app.vercel.app
GitHub: https://github.com/lizpatts/military-sep-app
Local: C:\Users\15125\Desktop\military-sep-app\web
Admin email: lizkaypatterson@gmail.com

Code Style Rules (NEVER BREAK THESE)

JavaScript only — never TypeScript
Inline styles only — never CSS modules, Tailwind, or styled-components
Keep components in single files — no separate CSS or JS files per component
All UUIDs in database tables — never bigint for primary keys
No Prisma, no tRPC
Git commands must be run separately in PowerShell (not chained with &&)
Always run npm run build before pushing
User is a beginner developer — always provide complete file rewrites when making multiple changes


Tech Stack

Frontend: Next.js 16.2.2 (Turbopack), JavaScript only, inline styles
Database: Supabase (Postgres + Auth + RLS)
Hosting: Vercel
Email: Resend
Maps: Google Maps JavaScript API
Auth: Google OAuth only (PKCE flow via /app/auth/callback/route.js, session stored in cookies via @supabase/ssr)


Build Commands
Run these separately in PowerShell — do not chain with &&

npm run dev
npm run build
git add .
git commit -m "message"
git push


Environment Variables
Set in both .env.local AND Vercel dashboard.

NEXT_PUBLIC_SUPABASE_URL=https://uwrkhzcdfzjkqetnciar.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBPn2GAHuR_mtMXJmjljEG7JksRQu-qMu8
RESEND_API_KEY=re_JG9U4odZ_FmSkruXF1bkvam6jruDnamjB
SUPABASE_SERVICE_KEY=xxx
CRON_SECRET=xxx
NEXT_PUBLIC_APP_URL=https://military-sep-app.vercel.app


Key File Paths

Sidebar component: app/components/Sidebar.js
Dashboard: app/dashboard/page.js
Checklist: app/checklist/page.js
Certifications: app/certifications/page.js
Calculators: app/calculators/page.js
Blog index: app/blog/page.js
Blog post: app/blog/[slug]/page.js
Settings: app/settings/page.js
SkillBridge map: app/skillbridge/page.js
Admin panel: app/admin/skillbridge/page.js
Login: app/login/page.js
Onboarding: app/onboarding/page.js
Guest: app/guest/page.js
SkillBridge submit API: app/api/skillbridge/submit/route.js
SkillBridge admin API: app/api/skillbridge/admin/route.js
Notifications email API: app/api/notifications/email/route.js
Notifications schedule API: app/api/notifications/schedule/route.js
Auth callback: app/auth/callback/route.js
Supabase client: ../../lib/supabase (browser) or @supabase/ssr (server/API routes)
API routes: app/api/ using Next.js Route Handlers (not pages/api)


Design System
Theme: White/light — fully completed across all pages
Colors:

Page background: #f9fafb
Cards: #fff with border: 1px solid #e5e7eb
Text headings: #111
Text body: #6b7280
Text muted: #9ca3af
Border radius: 12px cards, 8px inputs/buttons
Font: -apple-system, BlinkMacSystemFont, Inter, sans-serif

Accent colors:

Blue: #2563eb
Green: #22c55e
Amber: #f59e0b
Red: #ef4444

Branch accent colors:

Army: #16a34a ⚔️
Navy: #1d4ed8 ⚓
Air Force: #0891b2 ✈️
Marine Corps: #dc2626 🦅
Space Force: #7c3aed 🚀
Coast Guard: #d97706 ⚓

Fixed color roles:

Checklist progress: always green #22c55e
VA disability: always blue #2563eb
Critical priority: red #ef4444
High priority: orange #f59e0b
Normal priority: blue #3b82f6

Sidebar: Shared component at app/components/Sidebar.js — used on all pages.
Optional props: isGuest, guestBranch, guestSepType

Architecture Decisions
Auth
Supabase Google OAuth with PKCE flow via /app/auth/callback/route.js. Session stored in cookies via @supabase/ssr. Google OAuth consent screen published — external users allowed. Supabase site URL set to https://military-sep-app.vercel.app with redirect URL https://military-sep-app.vercel.app/auth/callback.
Database
Supabase PostgreSQL. All tables use UUID primary keys. RLS enabled on all tables with per-user policies.
Tables:

profiles — user profile data
checklist_items — master checklist (seeded)
user_checklist_progress — completed/hidden per user
user_custom_tasks — custom tasks per user
certifications — certification catalog
cert_favorites — favorited certs per user
skillbridge_locations — map locations (status: approved/pending/rejected)
skillbridge_favorites — favorited locations per user
blog_posts — blog content (admin publishes via Supabase Table Editor)
va_disability_scenarios — saved VA calculator scenarios per user
notification_log — notification history

Key columns on skillbridge_locations:

status text (default 'approved')
notes text
submitted_by_branch text
is_community_submitted boolean
latitude, longitude float

Notifications
Resend for email. Vercel cron job runs daily at 9am UTC via vercel.json hitting /api/notifications/schedule. SMS (Twilio) and push notifications not yet implemented.
Maps
Google Maps JavaScript API loaded dynamically in /app/skillbridge/page.js. 120+ SkillBridge locations stored in Supabase. DoD SkillBridge link: https://skillbridge.osd.mil/locations.htm
Calculators
Client-side only (no API calls). TSP includes BRS military match, separation age, inflation adjustment, Chart.js growth chart. GI Bill uses approximate 2024 BAH rates by state. VA Disability uses whole person method, 2024 rates, clears result on any rating change.
Checklist Priority
Items have priority field (normal, high, critical). Users within 365 days of separation see high/critical items only. Hidden items excluded from progress % unless completed. Progress = completed/(total - hidden_uncompleted). Custom tasks counted separately.
Guest Mode
Read-only. Passes ?guest=true&branch=X&separation_type=Y through all navigation. Saving blocked. Settings blocked.
Blog
Posts stored in Supabase blog_posts table. Individual posts at /blog/[slug]. Basic HTML content rendering (no markdown yet).

Completed Features

Google OAuth sign in (external users allowed)
Onboarding with branch selector grid
Guest mode across all pages
Shared Sidebar with branch colors, motto, countdown
White/light theme across all 12 pages
Dashboard with stat cards, countdown, deadlines (outline border style only — no heavy background colors)
Dashboard checklist cards link to checklist page on click
Checklist with priority tags, mute, custom tasks, crunch time mode
SkillBridge map with 120+ locations, community submissions, admin panel
DoD SkillBridge banner with working link to locations.htm
TSP, GI Bill, VA Disability calculators
VA calculator recalculates fresh on every rating change
VA scenarios saved to Supabase
Certifications with favorites and cost badges
Blog index + single post reader at /blog/[slug]
Settings with notification toggles
Email notifications via Resend + Vercel cron
Admin SkillBridge panel (email protected)
Supabase keys rotated
OAuth redirect URL fixed


Remaining Goals
High Priority

Stripe donation tab "Landing Fees" — on hold, research grants/nonprofit funding first. Stripe = 2.9% + $0.30/transaction.
App Store submission (iOS)
Google Play submission (Android)

Medium Priority

~100 more SkillBridge programs — check skillbridge.osd.mil/locations.htm
Branch COOL tags on certifications — tag certs by which branches have COOL funding
Biweekly newsletter — financial advice, budgeting, transition interviews. Use existing Resend infrastructure.
Rent vs Own calculator — waiting for user to build their own version first
SMS notifications (Twilio) — deprioritized, push notifications cover same use case

Stretch Goals

Spouse mode — separate onboarding and checklist for military spouses
Grants/nonprofit funding research — 501(c)(3) status, veteran-focused grants
Partnership outreach — skillbridge.osd.mil, dodtap.mil, militaryonesource.mil, military-transition.org
Google Maps AdvancedMarkerElement migration — current Marker deprecated (non-breaking, 12+ months notice)
@supabase/auth-helpers-nextjs migration — deprecated warning in build (non-breaking)
Blog markdown renderer — current content rendering is basic HTML replacement


Known Issues / Technical Debt

Google OAuth cancel on localhost throws Chrome iframe error (harmless, production only)
@supabase/auth-helpers-nextjs deprecated warning in build (non-breaking)
Google Maps Marker deprecation warning (non-breaking)
Blog content rendering is basic — no markdown support yet


App Stats

Estimated total dev hours: 65-95 hours
Estimated freelance value: $8,000-$25,000+
Pages: 12 (dashboard, checklist, certifications, calculators, blog, blog/[slug], settings, skillbridge, login, onboarding, guest, admin/skillbridge)
SkillBridge locations seeded: 120+