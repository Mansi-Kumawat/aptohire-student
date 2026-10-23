# Vercel Deployment & Environment Variables Guide

This guide explains how to deploy the AptoHire Student Portal on Vercel and what environment variables to configure.

---

## 1. Vercel Project Settings

When importing your Git repository into Vercel:

| Setting | Value |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` (if deploying from a monorepo) or `./` (if repository is frontend-only) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

## 2. Environment Variables Configuration

Go to **Project Settings** → **Environment Variables** in Vercel. Choose the configuration that matches your target deployment:

### Option A: Production Deployment (Connected to Real Supabase Backend)

Use this when you have set up a Supabase project and run the database migrations from `backend/supabase/migrations/`:

```env
VITE_APP_ENV=production
VITE_DEMO_MODE=false
VITE_USE_MOCKS=false
VITE_SITE_URL=https://your-student-portal.vercel.app
VITE_ROOT_URL=https://your-main-domain.com
VITE_ROOT_DOMAIN=your-main-domain.com
VITE_UNIVERSITY_URL=https://university.your-main-domain.com
VITE_ORGANIZATION_URL=https://employer.your-main-domain.com
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_VIDEO_MAX_MB=50
VITE_VIDEO_MAX_SECONDS=190
VITE_SUPPORT_EMAIL=support@yourdomain.com
```

> **Security Note:** In `production`, `VITE_USE_MOCKS` and `VITE_DEMO_MODE` must be `false`, and `VITE_DEMO_PASSWORD` must be omitted. The build enforces this check to prevent demo code from executing in production.

---

### Option B: Demo / Staging Preview Deployment (Standalone with Mock Data)

Use this if you want an instant live portfolio or prototype demo where recruiters or stakeholders can log in immediately using the one-click demo personas (Aarav, Naman, Avi, Niya) without provisioning Supabase:

```env
VITE_APP_ENV=demo
VITE_DEMO_MODE=true
VITE_USE_MOCKS=true
VITE_SITE_URL=https://your-student-portal.vercel.app
VITE_ROOT_URL=https://your-student-portal.vercel.app
VITE_ROOT_DOMAIN=vercel.app
VITE_UNIVERSITY_URL=https://your-student-portal.vercel.app
VITE_ORGANIZATION_URL=https://your-student-portal.vercel.app
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_DEMO_PASSWORD=demo-password-fictional
VITE_VIDEO_MAX_MB=50
VITE_VIDEO_MAX_SECONDS=190
VITE_SUPPORT_EMAIL=support@yourdomain.com
```

---

## 3. Environment Variable Breakdown

| Variable | Required | Description |
|---|---|---|
| `VITE_APP_ENV` | Yes | Deployment environment: `production`, `demo`, or `local`. |
| `VITE_DEMO_MODE` | Yes | `false` for real authentication; `true` to enable quick-select demo student persona logins. |
| `VITE_USE_MOCKS` | Yes | `false` to communicate with real Supabase / backend API; `true` to run fully standalone in-browser. |
| `VITE_SITE_URL` | Yes | The canonical public URL of your Vercel deployment (e.g., `https://student.yourdomain.com` or `https://my-app.vercel.app`). |
| `VITE_ROOT_URL` | Yes | Root URL of your platform ecosystem. Can match `VITE_SITE_URL` if hosting a single portal. |
| `VITE_ROOT_DOMAIN` | Yes | Top-level or apex domain used for cookie scoping and cross-subdomain links. |
| `VITE_UNIVERSITY_URL`| Yes | URL for the institutional partner portal. |
| `VITE_ORGANIZATION_URL`| Yes | URL for employer / recruiter portal. |
| `VITE_SUPABASE_URL` | For Prod | Your Supabase project URL (`https://<project-ref>.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | For Prod | The public `anon` key from your Supabase dashboard (**API** settings). Safe for client-side use. |
| `VITE_DEMO_PASSWORD` | Demo only| Password used by mock auth during demo mode. |
| `VITE_VIDEO_MAX_MB` | Optional | Max allowed upload size for video proof submissions in MB (default: `50`). |
| `VITE_VIDEO_MAX_SECONDS`| Optional | Max allowed video recording duration in seconds (default: `190`). |
| `VITE_SUPPORT_EMAIL` | Optional | Contact address displayed in help dialogues and ticket appeals (default: `support@yourdomain.com`). |
