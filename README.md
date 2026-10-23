# AptoHire: Proof-First Engineering Platform

AptoHire connects verified student engineers to employers through real-world multi-modal project assessments, skill graph evaluations, and verifiable credential audit trails.

---

## Repository Structure

This monorepo contains the complete, production-ready frontend portal and backend API:

```text
├── frontend/                          # Student Portal (Vite + React 18 + TypeScript + Tailwind)
│   ├── src/
│   │   ├── app/                      # Shell layout, AuthGate, RoleGuard, Router
│   │   ├── components/               # Proof rings, skill graph, back button, UI primitives
│   │   ├── features/                 # Auth personas, projects, submissions, scorecard
│   │   ├── lib/                      # Mock backend engine, scoring algorithms, domain types
│   │   └── pages/                    # 21 complete views (Home, Scorecard, Submission, Resume, etc.)
│   ├── e2e/                          # 50 Playwright responsive tests (360px - 1440px)
│   ├── tests/                        # Vitest unit and integration test suites
│   ├── vercel.json                   # Subfolder Vercel deployment configuration & CSP headers
│   ├── vite.config.ts                # Vite build configuration with vendor chunk splitting
│   └── package.json
│
├── backend/                           # Node.js / Express REST API server
│   ├── src/                          # Server routes, CORS config, health checks
│   ├── supabase/                     # PostgreSQL schemas, RLS policies, migrations
│   ├── tests/                        # Vitest backend integration test suite
│   └── package.json
│
├── vercel.json                        # Root Vercel deployment config (zero-config root deploy)
├── package.json                       # Monorepo root workspace configuration
└── .gitignore                         # Universal exclusion of node_modules, dist, .env, and caches
```

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Both Services
- **Frontend (Student Portal)**:
  ```bash
  cd frontend
  npm run dev
  # Runs on http://localhost:5174
  ```

- **Backend (API Server)**:
  ```bash
  cd backend
  npm run dev
  # Runs on http://localhost:4000
  ```

---

## How to Push to GitHub

Follow these steps to push this project to your GitHub account:

### Step 1: Initialize Git and Stage Files
```bash
git init
git add .
git commit -m "feat: complete AptoHire proof platform with verified scorecards and modern UX"
git branch -M main
```

### Step 2: Create a New GitHub Repository
1. Go to [GitHub New Repository](https://github.com/new).
2. Name your repository (e.g. `aptohire`).
3. Leave "Initialize this repository with a README" **unchecked** (we already have one).
4. Click **Create repository**.

### Step 3: Link Remote and Push
```bash
# Replace YOUR_USERNAME and YOUR_REPO with your GitHub details:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## How to Deploy on Vercel (Zero-Config Fix)

We have configured **both** root and subfolder Vercel deployment configurations, resolving the common monorepo deployment errors:

### Option A: Standard Root Import (Recommended)
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Import your GitHub repository.
3. Keep the **Root Directory** as `./` (default).
4. Vercel automatically reads the root `vercel.json` and `package.json`, which executes:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/dist`
5. Click **Deploy**.

### Option B: Setting Root Directory to `frontend`
1. If you prefer to point directly to `frontend`: In Vercel Project Settings &rarr; **Root Directory**, set it to `frontend`.
2. Vercel will use `frontend/vercel.json` with `dist` output directory automatically.

### Environment Variables on Vercel (Optional)
If deploying in standalone/demo mode, **no environment variables are required**. The platform includes a self-contained in-memory mock engine with persistent session storage.

If connecting to Supabase in production:
```env
VITE_APP_ENV=production
VITE_USE_MOCKS=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Automated Test Suites

```bash
# Run Vitest unit & integration tests
npm --prefix frontend test
npm --prefix backend test

# Run 50 responsive Playwright E2E tests across 5 viewports
npm --prefix frontend run e2e
```

---

## Demo Personas

When running or deploying, one-click sign-in is available for testing:
- **Aarav Sharma**: Frontend Developer with verified React score (72 Proficient).
- **Avi Verma**: Backend Engineer with verified SQL score (88 Advanced) and query tuning audit.
- **Niya Sen**: Product Analyst with verified Market Analysis score (74 Proficient).
- **Naman Patel**: First-time user onboarding flow with zero submissions.
