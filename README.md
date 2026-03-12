# TLL Academy — Certification Franchisé

Programme de certification en ligne pour les franchisés The Landlord. 4 sessions, 48 questions, score minimum 80% par session.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (Auth + Postgres + RLS)
- **Tailwind CSS**
- **Vercel** (deployment)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Authentication > Providers** and ensure **Email** provider is enabled
4. (Optional) Disable email confirmation in **Authentication > Settings** for development

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project settings > API
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings > API (keep secret)

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Create admin account

Register with `admin@thelandlord.tn` — the database trigger automatically sets `is_admin = true`.

## Deploy to Vercel

1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Set custom domain: `academy.thelandlord.tn`
5. In your DNS provider, add a CNAME record pointing `academy` to `cname.vercel-dns.com`

## Project Structure

```
tll-academy/
├── app/
│   ├── layout.tsx              → root layout
│   ├── page.tsx                → redirect to /login or /dashboard
│   ├── (auth)/
│   │   ├── login/page.tsx      → login form
│   │   └── register/page.tsx   → registration form
│   ├── dashboard/page.tsx      → session cards + progress
│   ├── quiz/[sessionId]/page.tsx → quiz engine
│   ├── results/[sessionId]/page.tsx → score + pass/fail
│   ├── certificate/page.tsx    → final certificate
│   └── admin/page.tsx          → admin dashboard
├── components/                 → reusable UI components
├── lib/
│   ├── supabase.ts             → browser client
│   ├── supabase-server.ts      → server client
│   └── questions.ts            → 48 questions data
├── types/index.ts              → TypeScript interfaces
├── middleware.ts               → route protection
└── supabase/schema.sql         → database schema + RLS
```

## Quiz Rules

- 4 sessions × 12 questions = 48 total
- 80% minimum to pass each session
- Sessions unlock sequentially
- All 4 passed → certification granted
