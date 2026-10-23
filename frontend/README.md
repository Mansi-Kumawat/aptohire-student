# AptoHire Student Portal

AptoHire connects verified student engineers to employers through real-world multi-modal project assessments, live skill graph evaluations, and verifiable credential audit trails.

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server (port 5174)
npm run dev

# 3. Run unit & integration tests (26 Vitest tests)
npm test

# 4. Run responsive E2E tests (50 Playwright tests across 5 viewports)
npm run e2e

# 5. Production build
npm run build
```

---

## Deployment Guide (Vercel / Netlify / Cloudflare / GitHub Pages)

The frontend is **100% self-contained** and includes a built-in mock backend engine with persistent 30-day session cookies, full rubric scoring, project assignment briefs, and PDF resume generation.

### 1. Deploying on Vercel
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Framework Preset: **Vite** (auto-detected).
3. Root Directory: `./` (or `frontend` if deploying from a monorepo).
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Click **Deploy**. SPA routing and security headers are pre-configured in `vercel.json`.

### 2. Deploying on Netlify
- Netlify SPA routing is pre-configured via `public/_redirects` (`/*  /index.html  200`).
- Build Command: `npm run build`.
- Publish Directory: `dist`.

### 3. Deploying on GitHub Pages
- GitHub Pages SPA routing is pre-configured with `public/404.html` and `index.html` URL recovery.

---

## Demo Personas (One-Click Sign In)

- **Aarav Sharma**: Frontend Developer with verified React score (72 Proficient) and TypeScript (58 Competent).
- **Avi Verma**: Backend Engineer with verified SQL score (88 Advanced) and query tuning audit trail.
- **Niya Sen**: Product Analyst with verified Market Analysis score (74 Proficient).
- **Naman Patel**: First-time student user onboarding flow with zero submissions.

---

## Features

- **Multi-Modal Project Submissions**: Repository code validation, document upload with magic-bytes verification, demo video with duration checks, originality reflections, and AI tool disclosures.
- **6-Stage Audit Progress**: Visual pipeline tracking (received &rarr; reading &rarr; watching &rarr; scoring &rarr; writing &rarr; done) with confidence metrics and reviewer appeals.
- **Scorecard & Skill Graph**: Interactive Living Skill Graph with family groupings and proof rings.
- **Tamper-Evident Verification**: Public proof certificates at `/verify/:credentialId` with cryptographic audit badges.
- **Digital Resume**: Downloadable executive PDF resume with live verification QR code.
- **Session & Cookie Persistence**: 30-day cross-tab session cookies with automatic rehydration and multi-tab synchronization.
