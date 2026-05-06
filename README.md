# ZOE Star Agency · Webapp · Phase 1 MVP

Premium-Brand-Website + Creator-Portal unter `zoe-star.de`.

**Stack:** Next.js 14 (App Router) · Tailwind · Framer Motion · Supabase (Auth/DB/Storage) · Resend · Vercel · Dogado-DNS.

---

## Setup

### 1. Local Dev Environment
```bash
# Clone Repo
git clone git@github.com:ZOE8842/zoe-star-agency.git
cd zoe-star-agency

# Dependencies
npm install
# oder
pnpm install

# .env.local kopieren
cp .env.example .env.local
# Werte einfügen: Supabase-URL, Anon-Key, Service-Role, Resend-Key
```

### 2. Supabase Setup
```bash
# Supabase CLI installieren (einmalig)
npm install -g supabase

# Project verbinden
npx supabase link --project-ref vvmsftyyijeyshikshsi

# Migrations pushen
npx supabase db push

# (Alternativ: SQL aus supabase/migrations/ manuell in Supabase-Dashboard SQL-Editor laufen lassen)
```

### 3. Dev-Server starten
```bash
npm run dev
# → http://localhost:3000
```

### 4. Vercel Deploy
```bash
# Vercel CLI installieren
npm install -g vercel

# Login + Link
vercel login
vercel link --scope team_72ikY6e8mrgq0SBAawczGIRY

# Env-Vars in Vercel setzen (oder via Dashboard)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add NEXT_PUBLIC_SITE_URL production

# Deploy
vercel --prod
```

### 5. Domain bei Dogado verbinden
1. Dogado-Customer-Center → DNS-Verwaltung → `zoe-star.de`
2. CNAME-Eintrag setzen:
   ```
   www.zoe-star.de → cname.vercel-dns.com
   ```
3. Apex-Domain (`zoe-star.de`) als A-Record:
   ```
   zoe-star.de → 76.76.21.21
   ```
4. SSL-Cert wird automatisch von Vercel ausgestellt (~5 min)
5. In Vercel: Domain → "Add Domain" → `zoe-star.de`

---

## Folder Structure
```
99_Webapp/
├── app/
│   ├── page.tsx                  Public Homepage
│   ├── layout.tsx                Root Layout (Inter + Playfair Fonts)
│   ├── (public)/                 Public Routes (agency, talent, etc.)
│   └── portal/
│       ├── login/page.tsx        Login
│       ├── signup/page.tsx       Invite-Signup
│       ├── page.tsx              Creator Dashboard
│       ├── admin/page.tsx        Admin Console
│       └── logout/route.ts       POST → signOut
├── components/
│   ├── Logo.tsx                  Inline-SVG Logo (3 Variants)
│   ├── Header.tsx                Public Header
│   └── Footer.tsx                Public Footer
├── lib/
│   └── supabase/
│       ├── client.ts             Browser-Client (Anon-Key)
│       └── server.ts             Server-Client (SSR)
├── supabase/
│   └── migrations/
│       ├── 0001_initial_schema.sql   16 Tabellen + Helper-Functions
│       └── 0002_rls_policies.sql     Row-Level-Security
├── styles/
│   └── globals.css               Tailwind + Brand-Tokens
├── middleware.ts                 Auth-Middleware (/portal/*)
├── tailwind.config.ts            Brand-Token-Config
├── next.config.mjs
├── tsconfig.json
├── package.json
├── .env.local                    (gitignored)
├── .env.example
└── README.md
```

---

## Phase-1-Features (this build)
- ✅ Public Homepage (Hero · Manifest · Categories · CTA)
- ✅ Logo-System (Horizontal · Monogram · Avatar)
- ✅ Login (E-Mail + Passwort)
- ✅ Signup (Invite-Code + E-Mail + Passwort + TikTok-Username)
- ✅ Creator Dashboard
- ✅ Admin Console (Stats + Quick-Actions)
- ✅ Auth-Middleware (Routen-Schutz + Redirects)
- ✅ Database-Schema (16 Tabellen + Enums + Helper-Functions)
- ✅ RLS-Policies (Creator/Manager/Admin)
- ⏳ Public Sub-Pages (agency · talent · etc.) — Skeleton vorbereiten
- ⏳ Creator-Inbox · Events · Slots · Downloads · Support — Phase 1 Schritt 2
- ⏳ Resend E-Mail-Reminder via Edge-Function — Phase 1 Schritt 3
- ⏳ Vercel Deploy + Dogado-DNS — Phase 1 Schritt 4

## Phase 2 (separat)
- Akademie + Quiz + Badge-Auto-Award
- Manager-Panel
- Bessere Reminder-Logik

## Phase 3 (separat)
- AI-Assistant (Claude API)
- Profilanalyse (TikTok-Scraping via Apify)
- Multi-Language DE/EN/TR/FR
- Web Push / PWA

---

## Brand-Tokens
| Token | Hex | Tailwind |
|---|---|---|
| Champagne | `#C9A86A` | `champagne` |
| Cream | `#F4F1E7` | `cream` |
| Rich Black | `#0A0A0A` | `ink` |

Fonts: Inter (sans) · Playfair Display Italic (display).

---

## Scripts
```bash
npm run dev          # Dev-Server
npm run build        # Production-Build
npm run start        # Production-Server
npm run lint         # ESLint
npm run type-check   # TypeScript-Check
npm run db:push      # Supabase migrations push
npm run db:gen-types # TypeScript-Types aus Supabase-Schema generieren
```

---

## Versions-Historie
| Version | Datum | Änderung | Autor |
|---|---|---|---|
| v0.1.0 | 2026-05-06 | Initial-Skeleton: Homepage + Login + Signup + Dashboard + Admin + DB-Schema + RLS | Aura |
