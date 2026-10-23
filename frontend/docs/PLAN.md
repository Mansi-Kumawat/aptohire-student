# AptoHire Student Portal (`student.aptohire.com`) — Implementation Plan

## 1. Route List
All routes (except shell and login) are `React.lazy` loaded via React Router data router:
- `/login` — Sign in with email + password, demo accounts panel (local/demo only)
- `/signup` — Student sign-up with password strength indicator
- `/forgot-password` — Password recovery request
- `/reset-password` — Set new password
- `/auth/callback` — Auth PKCE callback and onboarding bootstrap (`complete-signup`)
- `/onboarding` — 3-step guided flow: About you → University verification → Target skills/roles
- `/` (Home) — Student dashboard: personalized "What to do next", stats, skills summary, pending requests
- `/projects` — My projects list with status tabs (All, Active, Scored)
- `/projects/new` — Project assistant chat-style brief generator with target level selector
- `/projects/:assignmentId` — Project brief with scenario, deliverables checklist, rubric preview, constraints
- `/submissions/new` — New submission form (from assignment `?assignment=` or own project `?own=1`)
- `/submissions/:id/edit` — Submission editor with autosave, video upload (TUS), document validation, AI disclosure
- `/submissions/:id` — Live review progress (`received → reading → watching → scoring → writing → done`), scorecard reveal, retry
- `/scorecard` — All skills list with 96px Proof Rings, family grouping, living skill graph toggle
- `/scorecard/:skillSlug` — Skill detail with 240px Proof Ring, evidence trail, history chart/table, next steps, appeal ticket
- `/sharing` — Sharing inbox: Requests (consent sheet), Active access (with expiry & withdraw), History, Feedback
- `/profile` — Student profile tabs: Overview, Education (affiliations & proposals), Connected sources, Visibility & preview
- `/resume` — Digital resume web view, print stylesheet, dynamic A4 PDF download with QR code to public verification
- `/notifications` — Full notifications centre with status filters and deep links
- `/account` — Email & password management, global sign-out, data export, account deletion, demo reset
- `/help` — Help & FAQ, verification rubric guide, support contact, links to root legal pages
- `*` — 404 page with "Go home"

## 2. Feature Modules (`src/features/`)
Each module encapsulates UI components, API hooks (TanStack Query), and Zod schemas:
1. `auth` — Login, signup, password reset, demo switcher, PKCE callback, bootstrap hook
2. `onboarding` — 3-step university affiliation and target skill selector
3. `shell` — AppShell with responsive navigation (rail, drawer, bottom tab bar, More sheet), TopBar, NotificationBell
4. `profile` — Profile overview, photo crop/re-encode, credential ID, public preview
5. `affiliations` — Timeline, lifecycle states, proposal merge banner, add university dialog
6. `projects` — Project assistant, brief viewer, project status list
7. `submissions` — Submission form, TUS resumable upload, magic byte file validation, debounced autosave
8. `audit` — Realtime review progress stages, announcers, failure retry
9. `scorecard` — ProofRing, EvidenceRow, EvidenceSheet (video seeker, code viewer, doc excerpt), appeal tickets
10. `skillgraph` — d3-force interactive graph with list view toggle, keyboard navigation
11. `tickets` — Appeal creation dialog, anonymous ticket resolution timeline
12. `sources` — GitHub OAuth flow, LinkedIn export parser, manual links, profile proposals
13. `sharing` — Access requests cards, scope & duration consent modal, withdraw access dialog, feedback list
14. `resume` — Digital resume layout, `@react-pdf/renderer` + `qrcode` dynamic builder
15. `notifications` — Realtime notification bell, popover, full notifications list
16. `account` — Account security, global sign-out, data export, account deletion, demo reset
17. `config` — Public app config hook (passMark, borderline range, video limits)

## 3. Backend Interface (`src/lib/backend/types.ts`)
Grouped by feature with strict Zod-validated inputs and outputs:
- `auth`: `getSession`, `signIn`, `signUp`, `signOut`, `updateEmail`, `updatePassword`, `onAuthStateChange`
- `student`: `getProfile`, `updateProfile`, `uploadAvatar`, `removeAvatar`, `getVisibility`, `updateVisibility`
- `affiliations`: `listAffiliations`, `listProposals`, `confirmAffiliation`, `addAffiliation`, `updateAffiliation`
- `skills`: `listSkills`, `listSkillEdges`
- `projects`: `listAssignments`, `getAssignment`, `assignProject`, `updateAssignmentStatus`
- `submissions`: `listSubmissions`, `getSubmission`, `saveDraft`, `submitProject`, `retrySubmission`
- `uploads`: `uploadVideoTus`, `uploadDocument`, `getSignedPlaybackUrl`
- `audits`: `getAudit`, `subscribeAgentRun`
- `scores`: `listSkillScores`, `getSkillScore`, `listScoreHistory`
- `tickets`: `listTickets`, `createTicket`
- `sources`: `listSources`, `updateSourceConsent`, `syncSource`, `disconnectSource`, `listProposals`, `applyProposal`, `dismissProposal`
- `sharing`: `listAccessRequests`, `respondAccessRequest`, `withdrawAccess`, `listFeedback`
- `notifications`: `listNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `subscribeNotifications`
- `config`: `getPublicConfig`
- `account`: `exportMyData`, `deleteMyAccount`, `resetDemoData`

## 4. What Will Be Mocked (Deterministic In-Memory Backend)
- **Persistence:** In-memory store with `sessionStorage` fallback; demo accounts: Aarav, Naman, Avi, Niya.
- **Review Simulation:** Stepwise transition `received → reading → watching → scoring → writing → done` (approx. 12s, 2s per step) with hash-based rubric scoring on rubric `web-frontend@1`. Scores 40–60 trigger borderline status.
- **Project Assistant:** Immediate brief generation for Web/Frontend; `[fail]` triggers simulated failure for retry testing; `[slow]` triggers 40s duration.
- **Uploads:** Simulated chunked resumable upload with progress; signed video URLs mock local playback with interactive transcript.
- **Sources & Proposals:** Simulated GitHub repo discovery and LinkedIn profile parsing with actionable proposals.
- **Realtime:** In-memory event bus mirroring Supabase channels with auto-unsubscribe.
