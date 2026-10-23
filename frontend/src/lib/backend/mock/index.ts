import {
  AccessRequest,
  Affiliation,
  AffiliationProposal,
  AgentRun,
  Audit,
  AuditCriterion,
  FeedbackItem,
  NotificationItem,
  ProfileProposal,
  ProfileSource,
  ProjectAssignment,
  ProjectBrief,
  PublicConfig,
  SkillEdge,
  SkillItem,
  SkillScore,
  SkillScoreHistory,
  StudentProfile,
  Submission,
  SubmissionDocument,
  Ticket,
  UniversityPublic,
  VisibilitySettings,
} from '../../domain/types';
import {
  LoginInput,
  RegisterStudentInput,
  RespondAccessInput,
  SignupInput,
  TicketFormInput,
} from '../../schemas';
import { levelFor, isVerified, isBorderline } from '../../scoring';
import { AuthUser, Backend, RegisterResult } from '../types';
import {
  getInitialSeedState,
  MOCK_USERS,
  SEED_SKILL_EDGES,
  SEED_SKILLS,
  SEED_UNIVERSITIES,
} from './seed';
import {
  saveAuthSession,
  getAuthSession,
  clearAuthSession,
  onSessionSync,
} from '@/lib/session';

const STORAGE_KEY = 'aptohire_mock_state_v1';

type Listener<T> = (data: T) => void;

class MockEventBus {
  private listeners: Map<string, Set<Listener<unknown>>> = new Map();

  on<T>(event: string, fn: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(fn as Listener<unknown>);
    return () => set.delete(fn as Listener<unknown>);
  }

  emit<T>(event: string, data: T) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((fn) => fn(data));
    }
  }
}

const bus = new MockEventBus();

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export class MockBackend implements Backend {
  private state: ReturnType<typeof getInitialSeedState>;
  private auditsStore: Map<string, Audit> = new Map();
  private runsStore: Map<string, AgentRun> = new Map();
  private ticketsStore: Map<string, Ticket[]> = new Map();
  private proposalSuggestions: Map<string, ProfileProposal[]> = new Map();
  private projectAssignCounts: Map<string, number> = new Map();

  constructor() {
    this.state = this.loadState();
    this.seedAudits();
  }

  private loadState(): ReturnType<typeof getInitialSeedState> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // storage unavailable
    }
    const initial = getInitialSeedState();
    this.saveState(initial);
    return initial;
  }

  private saveState(state: ReturnType<typeof getInitialSeedState>) {
    this.state = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

  private seedAudits() {
    // Audit for Aarav's scored submission
    const aaravAudit: Audit = {
      id: 'audit-aarav-1',
      submission_id: 'sub-aarav-1',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      overall: 72,
      confidence: 0.85,
      summary:
        'Aarav demonstrates proficient React architectural skills with clean decoupled components, accessible keyboard navigation, and thoughtful state management. The demo video effectively explains tradeoff decisions.',
      next_steps: [
        'Add integration tests using Vitest and React Testing Library to cover edge-case async rollback behavior',
        'Explore React Server Components or Suspense streaming patterns for initial load optimization',
        'Implement automated WCAG regression tests in CI',
      ],
      flags: [],
      borderline: false,
      review_status: 'none',
      per_skill: [
        {
          skill_id: 's-react',
          score: 72,
          criteria: [
            {
              name: 'Functionality & State',
              weight: 25,
              score: 74,
              rationale:
                'URL search state synchronization handles multiple filters cleanly with memoized filter state.',
              evidence_refs: ['live-1', 'code-1'],
            },
            {
              name: 'Code Quality & Structure',
              weight: 20,
              score: 75,
              rationale:
                'Clean separation of hooks and components with typed contracts and zero unnecessary re-renders.',
              evidence_refs: ['code-2'],
            },
            {
              name: 'UI, UX & Accessibility',
              weight: 15,
              score: 76,
              rationale:
                'Robust keyboard traps on modal drawers and verified screen-reader announcements.',
              evidence_refs: ['video-1'],
            },
            {
              name: 'Testing & Reliability',
              weight: 10,
              score: 65,
              rationale:
                'Unit test coverage is basic; async error rollback path lacks complete test coverage.',
              evidence_refs: ['code-3'],
            },
            {
              name: 'Documentation',
              weight: 10,
              score: 70,
              rationale:
                'Concise markdown guide with architecture decision records and clear local setup instructions.',
              evidence_refs: ['doc-1'],
            },
            {
              name: 'Problem Solving & Depth',
              weight: 10,
              score: 72,
              rationale:
                'Inverted index strategy effectively eliminated render lag across 1,000 items.',
              evidence_refs: ['code-1'],
            },
            {
              name: 'Communication (Video)',
              weight: 10,
              score: 70,
              rationale:
                'Structured 3-minute explanation covering architecture, tradeoffs, and live screen reader inspection.',
              evidence_refs: ['video-1'],
            },
          ],
        },
      ],
      evidence: [
        {
          ref: 'video-1',
          kind: 'video',
          label: 'Video 01:42',
          pointer: '102',
          excerpt:
            'Here we test keyboard navigation using tab and shift-tab through the filter group with aria-expanded toggles.',
        },
        {
          ref: 'code-1',
          kind: 'repo',
          label: 'src/hooks/useCatalogFilters.ts',
          pointer: 'src/hooks/useCatalogFilters.ts#L24-L68',
          excerpt:
            'export function useCatalogFilters(initialItems: CatalogItem[]) {\n  const [searchParams, setSearchParams] = useSearchParams();\n  const memoizedFiltered = useMemo(() => applyFilters(initialItems, searchParams), [initialItems, searchParams]);\n  return { filtered: memoizedFiltered, setFilter: ... };\n}',
        },
        {
          ref: 'code-2',
          kind: 'repo',
          label: 'src/components/FilterDrawer.tsx',
          pointer: 'src/components/FilterDrawer.tsx#L12-L45',
          excerpt:
            'export const FilterDrawer: React.FC<Props> = ({ isOpen, onClose }) => {\n  useFocusTrap(drawerRef, isOpen);\n  return <aside aria-label="Catalog filters">...</aside>;\n};',
        },
        {
          ref: 'code-3',
          kind: 'repo',
          label: 'tests/filter.test.ts',
          pointer: 'tests/filter.test.ts#L1-L30',
          excerpt: 'describe("catalog filters", () => {\n  it("updates query params", () => { ... });\n});',
        },
        {
          ref: 'doc-1',
          kind: 'doc',
          label: 'architecture-notes.md',
          pointer: 'architecture-notes.md#L1-L20',
          excerpt: '## Architecture Decision Record\n\n- ADR-01: Zero-runtime CSS\n- ADR-02: Headless Combobox primitive',
        },
        {
          ref: 'live-1',
          kind: 'live',
          label: 'Live site',
          pointer: 'https://aarav-catalog-demo.test',
          excerpt: 'Production deployment with sub-100ms response times.',
        },
      ],
      transcript: [
        { t: 0, text: 'Hello, in this demo I am presenting the accessible product catalog.' },
        { t: 30, text: 'First, let us look at the URL state synchronization for the filters.' },
        { t: 65, text: 'When selecting categories, notice how query params update without re-mounting.' },
        { t: 102, text: 'Here we test keyboard navigation using tab and shift-tab through the filter group with aria-expanded toggles.' },
        { t: 140, text: 'Now let us trigger an optimistic cart update and observe the error rollback.' },
        { t: 165, text: 'Thank you for reviewing.' },
      ],
    };

    this.auditsStore.set('sub-aarav-1', aaravAudit);
    this.auditsStore.set('audit-aarav-1', aaravAudit);

    const aviAudit: Audit = {
      id: 'audit-avi-1',
      submission_id: 'sub-avi-1',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      overall: 88,
      confidence: 0.92,
      summary:
        'Avi demonstrates advanced SQL design and query tuning skills with partitioned tables, composite indexing, and robust transactional concurrency patterns.',
      next_steps: [
        'Implement automated query plan regression tests in CI with pg_stat_statements',
        'Explore distributed query planning or Citus sharding for horizontal scale benchmarks',
        'Formalize disaster recovery runbooks and WAL archive replication metrics',
      ],
      flags: [],
      borderline: false,
      review_status: 'none',
      per_skill: [
        {
          skill_id: 's-sql',
          score: 88,
          criteria: [
            {
              name: 'Schema Design & Normalization',
              weight: 25,
              score: 90,
              rationale:
                'Clean 3NF relational schema with declarative table partitioning, composite keys, and check constraints.',
              evidence_refs: ['code-sql-1'],
            },
            {
              name: 'Query Optimization & Indexing',
              weight: 25,
              score: 88,
              rationale:
                'Demonstrated deep EXPLAIN ANALYZE tuning, cutting p95 query latency from 450ms down to 8ms using partial B-Tree indexes.',
              evidence_refs: ['code-sql-2'],
            },
            {
              name: 'Transactions & Concurrency',
              weight: 20,
              score: 86,
              rationale:
                'Strict isolation management with advisory locks preventing concurrency race conditions.',
              evidence_refs: ['code-sql-1'],
            },
            {
              name: 'Analytical Window Functions & CTEs',
              weight: 15,
              score: 92,
              rationale:
                'Sophisticated multi-level CTEs and window partition functions for real-time aggregation.',
              evidence_refs: ['code-sql-2'],
            },
            {
              name: 'Communication & Walkthrough',
              weight: 15,
              score: 85,
              rationale:
                'Clear, structured breakdown of query execution plan nodes and index selection tradeoffs.',
              evidence_refs: ['video-sql-1'],
            },
          ],
        },
      ],
      evidence: [
        {
          ref: 'video-sql-1',
          kind: 'video',
          label: 'Video 01:20',
          pointer: '80',
          excerpt:
            'Walking through the PostgreSQL query planner cost metrics before and after applying the composite partitioned index.',
        },
        {
          ref: 'code-sql-1',
          kind: 'repo',
          label: 'migrations/001_timeseries_schema.sql',
          pointer: 'migrations/001_timeseries_schema.sql#L15-L60',
          excerpt:
            'CREATE TABLE events (\n  id BIGSERIAL,\n  user_id UUID NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL\n) PARTITION BY RANGE (created_at);',
        },
        {
          ref: 'code-sql-2',
          kind: 'repo',
          label: 'queries/retention_funnel.sql',
          pointer: 'queries/retention_funnel.sql#L10-L45',
          excerpt:
            'WITH cohort_activity AS (\n  SELECT user_id, date_trunc(\'month\', created_at) AS cohort_month,\n  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS seq\n  FROM events\n)\nSELECT cohort_month, COUNT(DISTINCT user_id) FROM cohort_activity GROUP BY 1;',
        },
        {
          ref: 'doc-sql-1',
          kind: 'doc',
          label: 'query-optimization-notes.md',
          pointer: 'query-optimization-notes.md#L1-L30',
          excerpt:
            '## PostgreSQL Performance Benchmark\n- Baseline Sequential Scan: 450ms\n- Partition Pruning + Composite Index: 8ms',
        },
      ],
      transcript: [
        { t: 0, text: 'Hello, in this video walkthrough I will demonstrate the SQL analytics architecture.' },
        { t: 30, text: 'First, let us look at the table partitioning strategy across monthly date ranges.' },
        { t: 65, text: 'Now we run EXPLAIN ANALYZE on the un-indexed query to observe the sequential scan cost.' },
        { t: 100, text: 'Next, we add the composite partial index and confirm partition pruning kicks in.' },
        { t: 140, text: 'Here is the cohort analysis CTE executing in under 10 milliseconds.' },
        { t: 160, text: 'Thank you for reviewing.' },
      ],
    };

    this.auditsStore.set('sub-avi-1', aviAudit);
    this.auditsStore.set('audit-avi-1', aviAudit);

    const niyaAudit: Audit = {
      id: 'audit-niya-1',
      submission_id: 'sub-niya-1',
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      overall: 74,
      confidence: 0.86,
      summary:
        'Niya demonstrates strong analytical rigor across TAM modeling and cohort retention mechanics with clearly communicated business insights.',
      next_steps: [
        'Incorporate price elasticity modeling into future expansion revenue estimates',
        'Refine competitor feature weighting with blind user panel surveys',
      ],
      flags: [],
      borderline: false,
      review_status: 'none',
      per_skill: [
        {
          skill_id: 's-market',
          score: 74,
          criteria: [
            {
              name: 'Market Sizing & TAM Modeling',
              weight: 30,
              score: 76,
              rationale: 'Clean bottom-up and top-down TAM/SAM/SOM modeling with defensible customer segment sizing.',
              evidence_refs: ['doc-niya-1'],
            },
            {
              name: 'Cohort Retention & Churn Dynamics',
              weight: 30,
              score: 75,
              rationale: 'Robust cohort matrix calculating net revenue retention curves and churn inflection points.',
              evidence_refs: ['doc-niya-1'],
            },
            {
              name: 'Competitive Positioning',
              weight: 20,
              score: 72,
              rationale: 'Detailed feature parity grid comparing 4 direct competitors.',
              evidence_refs: ['doc-niya-1'],
            },
            {
              name: 'Presentation & Strategic Delivery',
              weight: 20,
              score: 73,
              rationale: 'Structured executive presentation explaining pricing tiers and go-to-market assumptions.',
              evidence_refs: ['video-niya-1'],
            },
          ],
        },
      ],
      evidence: [
        {
          ref: 'video-niya-1',
          kind: 'video',
          label: 'Video 01:15',
          pointer: '75',
          excerpt: 'Explaining the net revenue retention model and sensitivity analysis on enterprise churn.',
        },
        {
          ref: 'doc-niya-1',
          kind: 'doc',
          label: 'cohort-retention-model.xlsx',
          pointer: 'cohort-retention-model.xlsx#Sheet1',
          excerpt: 'Monthly cohort retention matrix and CAC payback period calculator.',
        },
      ],
      transcript: [
        { t: 0, text: 'Hello, in this presentation I will walk through the market sizing and cohort retention model.' },
        { t: 40, text: 'Here is the bottom-up TAM breakdown across mid-market B2B software accounts.' },
        { t: 90, text: 'Looking at the cohort matrix, notice how expansion revenue offsets logo churn at month 6.' },
        { t: 150, text: 'Thank you for your evaluation.' },
      ],
    };

    this.auditsStore.set('sub-niya-1', niyaAudit);
    this.auditsStore.set('audit-niya-1', niyaAudit);

    // Initial proposals for Aarav
    this.proposalSuggestions.set('user-aarav', [
      {
        source: 'github',
        changes: [
          {
            field: 'skills_interest',
            action: 'add',
            value: 'Next.js',
            evidence: 'From your GitHub repository aarav-dev/next-commerce',
          },
          {
            field: 'links',
            action: 'update',
            value: { github: 'https://github.com/aarav-dev' },
            evidence: 'Verified GitHub account link',
          },
        ],
      },
    ]);
  }

  private getSessionUser(): AuthUser | null {
    return getAuthSession();
  }

  private setSessionUser(user: AuthUser | null) {
    if (user) {
      saveAuthSession(user, true);
    } else {
      clearAuthSession();
    }
    bus.emit('auth_change', user);
  }

  private async sleep(ms = 350): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  // ---------------- AUTH ----------------
  auth = {
    getCurrentUser: async (): Promise<AuthUser | null> => {
      await this.sleep(100);
      return this.getSessionUser();
    },
    signIn: async (input: LoginInput): Promise<AuthUser> => {
      await this.sleep(300);
      const emailLower = input.email.toLowerCase().trim();
      const matched = MOCK_USERS.find((u) => u.email.toLowerCase() === emailLower);
      if (matched) {
        this.setSessionUser(matched);
        return matched;
      }
      // If student not recognized, create a dynamic student user
      const newUser: AuthUser = {
        id: `user-${simpleHash(emailLower)}`,
        email: emailLower,
        role: 'student',
        full_name: emailLower.split('@')[0],
      };
      this.setSessionUser(newUser);
      return newUser;
    },
    signUp: async (
      input: SignupInput
    ): Promise<{ user: AuthUser; requiresEmailVerification: boolean }> => {
      await this.sleep(400);
      const newUser: AuthUser = {
        id: `user-${simpleHash(input.email)}`,
        email: input.email,
        role: 'student',
        full_name: input.full_name,
      };
      this.setSessionUser(newUser);

      // Create initial profile
      const state = this.state;
      state.profiles[newUser.id] = {
        id: newUser.id,
        full_name: input.full_name,
        email: input.email,
        credential_id: `APT-${simpleHash(input.email) % 9000 + 1000}-STU`,
        headline: '',
        bio: '',
        location: '',
        languages: ['English'],
        links: {},
        target_skills: [],
        target_roles: [],
        visibility: {
          public_skills: true,
          public_levels: true,
          public_scores: true,
          public_name: true,
          public_university: false,
          discovery_opt_in: true,
        },
      };
      this.saveState(state);

      return { user: newUser, requiresEmailVerification: false };
    },
    signOut: async (_options?: { scope?: 'local' | 'global' }): Promise<void> => {
      await this.sleep(150);
      this.setSessionUser(null);
    },
    updateEmail: async (newEmail: string): Promise<void> => {
      await this.sleep(300);
      const user = this.getSessionUser();
      if (user) {
        user.email = newEmail;
        this.setSessionUser(user);
      }
    },
    updatePassword: async (_newPassword: string): Promise<void> => {
      await this.sleep(300);
    },
    completeSignup: async (): Promise<void> => {
      await this.sleep(200);
    },
    registerStudent: async (input: RegisterStudentInput): Promise<RegisterResult> => {
      await this.sleep(500);
      const user = this.getSessionUser();
      const studentId = user?.id || 'user-temp';
      const email = user?.email.toLowerCase() || '';

      // Avi case: confirm existing profile
      if (email === 'avi@demo.aptohire.test') {
        return {
          student_id: studentId,
          outcome: 'confirm_existing',
          matched_existing_person: true,
        };
      }

      // 1. Roster detection by domain: unia.edu.test
      if (input.choice.kind === 'detect') {
        if (email.endsWith('@unia.edu.test')) {
          const affiliation: Affiliation = {
            id: `aff-${Date.now()}`,
            student_id: studentId,
            university_id: 'uni-a',
            university_name: 'Uni A (Apex Institute of Technology)',
            program_level: input.program_level,
            year: input.year || 1,
            status: input.status || 'enrolled',
            is_verified: true,
            verification_type: 'roster',
            started_at: new Date().toISOString(),
            is_current: true,
          };
          this.state.affiliations[studentId] = [affiliation];
          this.saveState(this.state);
          return {
            student_id: studentId,
            outcome: 'verified_roster',
            affiliation,
            matched_existing_person: false,
          };
        } else {
          return {
            student_id: studentId,
            outcome: 'needs_student_id',
            matched_existing_person: false,
          };
        }
      }

      // 2. Student ID check: Uni B + "B-1042"
      if (input.choice.kind === 'student_id') {
        if (input.choice.student_id_number === 'B-1042') {
          const affiliation: Affiliation = {
            id: `aff-${Date.now()}`,
            student_id: studentId,
            university_id: input.choice.university_id,
            university_name: 'Uni B (Beacon State University)',
            program_level: input.program_level,
            year: input.year || 1,
            status: input.status || 'enrolled',
            is_verified: true,
            verification_type: 'student_id',
            started_at: new Date().toISOString(),
            is_current: true,
          };
          this.state.affiliations[studentId] = [affiliation];
          this.saveState(this.state);
          return {
            student_id: studentId,
            outcome: 'verified_student_id',
            affiliation,
            matched_existing_person: false,
          };
        } else {
          return {
            student_id: studentId,
            outcome: 'roster_no_match',
            matched_existing_person: false,
          };
        }
      }

      // 3. Unregistered university
      const affiliation: Affiliation = {
        id: `aff-${Date.now()}`,
        student_id: studentId,
        university_id: null,
        university_name: input.choice.university_name,
        program_level: input.program_level,
        year: input.year || 1,
        status: input.status || 'enrolled',
        is_verified: false,
        verification_type: 'unverified',
        started_at: new Date().toISOString(),
        is_current: true,
      };
      this.state.affiliations[studentId] = [affiliation];
      this.saveState(this.state);

      return {
        student_id: studentId,
        outcome: 'unverified',
        affiliation,
        matched_existing_person: false,
      };
    },
    onAuthStateChange: (callback: (user: AuthUser | null) => void) => {
      const unsubBus = bus.on<AuthUser | null>('auth_change', callback);
      const unsubSync = onSessionSync(callback);
      return () => {
        unsubBus();
        unsubSync();
      };
    },
  };

  // ---------------- STUDENT ----------------
  student = {
    getProfile: async (studentId: string): Promise<StudentProfile> => {
      await this.sleep(250);
      const profile = this.state.profiles[studentId];
      if (profile) return profile;
      return {
        id: studentId,
        full_name: 'Student',
        email: 'student@example.test',
        credential_id: `APT-${simpleHash(studentId) % 9000 + 1000}-STU`,
        headline: '',
        bio: '',
        location: '',
        languages: ['English'],
        links: {},
        target_skills: [],
        target_roles: [],
        visibility: {
          public_skills: true,
          public_levels: true,
          public_scores: true,
          public_name: true,
          public_university: true,
          discovery_opt_in: true,
        },
      };
    },
    updateProfile: async (
      studentId: string,
      updates: Partial<StudentProfile>
    ): Promise<StudentProfile> => {
      await this.sleep(300);
      const existing = await this.student.getProfile(studentId);
      const merged = { ...existing, ...updates };
      this.state.profiles[studentId] = merged;
      this.saveState(this.state);
      return merged;
    },
    uploadAvatar: async (
      studentId: string,
      _blob: Blob
    ): Promise<{ avatar_url: string }> => {
      await this.sleep(400);
      const signedAvatarUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=512&q=80&token=signed_${Date.now()}`;
      const profile = await this.student.getProfile(studentId);
      profile.avatar_url = signedAvatarUrl;
      this.state.profiles[studentId] = profile;
      this.saveState(this.state);
      return { avatar_url: signedAvatarUrl };
    },
    removeAvatar: async (studentId: string): Promise<void> => {
      await this.sleep(200);
      const profile = await this.student.getProfile(studentId);
      profile.avatar_url = null;
      this.state.profiles[studentId] = profile;
      this.saveState(this.state);
    },
    getVisibility: async (studentId: string): Promise<VisibilitySettings> => {
      const profile = await this.student.getProfile(studentId);
      return profile.visibility;
    },
    updateVisibility: async (
      studentId: string,
      settings: VisibilitySettings
    ): Promise<VisibilitySettings> => {
      await this.sleep(250);
      const profile = await this.student.getProfile(studentId);
      profile.visibility = settings;
      this.state.profiles[studentId] = profile;
      this.saveState(this.state);
      return settings;
    },
  };

  // ---------------- AFFILIATIONS ----------------
  affiliations = {
    listAffiliations: async (studentId: string): Promise<Affiliation[]> => {
      await this.sleep(200);
      return this.state.affiliations[studentId] || [];
    },
    listProposals: async (studentId: string): Promise<AffiliationProposal[]> => {
      await this.sleep(200);
      return this.state.proposals[studentId] || [];
    },
    confirmAffiliation: async (params: {
      student_id: string;
      proposal_id?: string;
      new?: {
        university_id?: string;
        university_name_text?: string;
        student_id_number?: string;
        program_level: 'ug' | 'pg';
        year?: number;
        status: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
      };
    }): Promise<Affiliation> => {
      await this.sleep(400);
      const studentId = params.student_id;
      const currentList = this.state.affiliations[studentId] || [];

      // Mark current affiliations as alumni/closed
      currentList.forEach((aff) => {
        aff.is_current = false;
        if (aff.status === 'enrolled') aff.status = 'alumni';
        aff.ended_at = new Date().toISOString();
      });

      let newAff: Affiliation;

      if (params.proposal_id) {
        const studentProposals = this.state.proposals[studentId] || [];
        const prop = studentProposals.find((p) => p.id === params.proposal_id);
        newAff = {
          id: `aff-${Date.now()}`,
          student_id: studentId,
          university_id: prop ? prop.university_id : 'uni-b',
          university_name: prop ? prop.university_name : 'Uni B (Beacon State University)',
          program_level: prop ? prop.program_level : 'pg',
          year: prop ? prop.year : 1,
          status: prop?.status || 'masters',
          is_verified: true,
          verification_type: 'roster',
          started_at: new Date().toISOString(),
          is_current: true,
        };
        // Remove proposal
        this.state.proposals[studentId] = studentProposals.filter(
          (p) => p.id !== params.proposal_id
        );
      } else if (params.new) {
        const isRegistered = !!params.new.university_id;
        newAff = {
          id: `aff-${Date.now()}`,
          student_id: studentId,
          university_id: params.new.university_id || null,
          university_name: params.new.university_name_text || 'New University',
          program_level: params.new.program_level,
          year: params.new.year || 1,
          status: params.new.status,
          is_verified: isRegistered && params.new.student_id_number === 'B-1042',
          verification_type: isRegistered ? 'student_id' : 'unverified',
          started_at: new Date().toISOString(),
          is_current: true,
        };
      } else {
        throw new Error('Invalid affiliation confirmation parameters');
      }

      currentList.unshift(newAff);
      this.state.affiliations[studentId] = currentList;
      this.saveState(this.state);
      return newAff;
    },
    updateAffiliation: async (
      studentId: string,
      affiliationId: string,
      updates: Partial<Affiliation>
    ): Promise<Affiliation> => {
      await this.sleep(300);
      const list = this.state.affiliations[studentId] || [];
      const item = list.find((a) => a.id === affiliationId);
      if (!item) throw new Error('Affiliation not found');
      // If verified, read-only
      if (item.is_verified) {
        throw new Error('Managed by your university. Cannot be edited directly.');
      }
      Object.assign(item, updates);
      this.saveState(this.state);
      return item;
    },
    listUniversities: async (): Promise<UniversityPublic[]> => {
      await this.sleep(150);
      return SEED_UNIVERSITIES;
    },
  };

  // ---------------- SKILLS ----------------
  skills = {
    listSkills: async (): Promise<SkillItem[]> => {
      await this.sleep(150);
      return SEED_SKILLS;
    },
    listSkillEdges: async (): Promise<SkillEdge[]> => {
      await this.sleep(150);
      return SEED_SKILL_EDGES;
    },
  };

  // ---------------- PROJECTS ----------------
  projects = {
    listAssignments: async (studentId: string): Promise<ProjectAssignment[]> => {
      await this.sleep(200);
      return this.state.assignments[studentId] || [];
    },
    getAssignment: async (assignmentId: string): Promise<ProjectAssignment | null> => {
      await this.sleep(150);
      for (const list of Object.values(this.state.assignments)) {
        const found = list.find((a) => a.id === assignmentId);
        if (found) return found;
      }
      return null;
    },
    assignProject: async (params: {
      student_id: string;
      target: { skill_slug?: string; role_text?: string };
      level?: 'Competent' | 'Proficient' | 'Advanced';
    }): Promise<{ assignment_id: string; brief: ProjectBrief }> => {
      await this.sleep(600);
      const count = (this.projectAssignCounts.get(params.student_id) || 0) + 1;
      this.projectAssignCounts.set(params.student_id, count);

      if (count > 5) {
        const error = new Error('You have reached today\'s limit for new projects. Try again tomorrow.');
        Object.assign(error, { code: 'QUOTA_EXCEEDED' });
        throw error;
      }

      const skillSlug = params.target.skill_slug?.toLowerCase() || '';
      const roleText = params.target.role_text?.toLowerCase() || '';

      const isWebFrontend =
        skillSlug.includes('react') ||
        skillSlug.includes('typescript') ||
        skillSlug.includes('javascript') ||
        skillSlug.includes('html') ||
        skillSlug.includes('frontend') ||
        roleText.includes('frontend') ||
        roleText.includes('web');

      if (!isWebFrontend && !skillSlug.includes('sql') && !skillSlug.includes('market')) {
        const error = new Error('Projects for this skill aren\'t available yet. You can upload a project you\'ve already built.');
        Object.assign(error, { code: 'NO_TEMPLATE' });
        throw error;
      }

      const level = params.level || 'Proficient';
      const briefId = `asg-${Date.now()}`;
      const targetSkill = params.target.skill_slug ? params.target.skill_slug : 'React';

      const brief: ProjectBrief = {
        title: `Real-time ${targetSkill} Analytics Dashboard`,
        scenario: `Build an operational analytics dashboard for a multi-tenant SaaS application that visualizes real-time metrics, supports custom date filtering, and ensures smooth 60fps rendering under high data volume.`,
        level,
        target_skills: [targetSkill, 'TypeScript', 'Accessibility'],
        deliverables: [
          'Interactive chart component with custom hover tooltips and range zoom',
          'Keyboard-accessible metrics table with sortable columns and CSV export',
          'Optimistic update panel with simulated WebSocket reconnection',
          '3-minute walkthrough video demonstrating keyboard accessibility and edge-case error states',
        ],
        constraints: [
          'Strict TypeScript with no any types',
          'Responsive down to 360px viewport without horizontal scrolling',
          'Clean WCAG 2.2 AA compliant focus states and aria announcements',
        ],
        suggested_stack: [targetSkill, 'TypeScript', 'Tailwind CSS'],
        estimated_hours: 14,
        rubric_preview: [
          { criterion: 'Functionality & State', weight: 25 },
          { criterion: 'Code Quality & Structure', weight: 20 },
          { criterion: 'UI, UX & Accessibility', weight: 15 },
          { criterion: 'Testing & Reliability', weight: 10 },
          { criterion: 'Documentation', weight: 10 },
          { criterion: 'Problem Solving & Depth', weight: 10 },
          { criterion: 'Communication (Video)', weight: 10 },
        ],
        video_guidance:
          'Demonstrate the real-time filter updates, inspect the DOM to show proper ARIA roles and tab indices, and discuss your data structures for fast metric recalculation.',
        originality_questions: [
          'What architecture did you choose to prevent charting re-render bottlenecks when new data streams in?',
          'How did you structure your components to ensure keyboard-only users have equal access to data tooltips?',
        ],
      };

      const assignment: ProjectAssignment = {
        id: briefId,
        student_id: params.student_id,
        brief,
        status: 'assigned',
        target_skill: targetSkill,
        created_at: new Date().toISOString(),
      };

      const userAssignments = this.state.assignments[params.student_id] || [];
      userAssignments.unshift(assignment);
      this.state.assignments[params.student_id] = userAssignments;
      this.saveState(this.state);

      return { assignment_id: briefId, brief };
    },
    updateAssignmentStatus: async (
      assignmentId: string,
      status: 'assigned' | 'in_progress' | 'submitted' | 'completed'
    ): Promise<ProjectAssignment> => {
      await this.sleep(200);
      for (const list of Object.values(this.state.assignments)) {
        const found = list.find((a) => a.id === assignmentId);
        if (found) {
          found.status = status;
          this.saveState(this.state);
          return found;
        }
      }
      throw new Error('Assignment not found');
    },
  };

  // ---------------- SUBMISSIONS ----------------
  submissions = {
    listSubmissions: async (studentId: string): Promise<Submission[]> => {
      await this.sleep(200);
      return this.state.submissions[studentId] || [];
    },
    getSubmission: async (submissionId: string): Promise<Submission | null> => {
      await this.sleep(150);
      for (const list of Object.values(this.state.submissions)) {
        const found = list.find((s) => s.id === submissionId);
        if (found) return found;
      }
      return null;
    },
    saveDraft: async (
      draft: Partial<Submission> & { student_id: string }
    ): Promise<Submission> => {
      await this.sleep(200);
      const studentId = draft.student_id;
      const list = this.state.submissions[studentId] || [];
      let sub: Submission;

      if (draft.id) {
        const idx = list.findIndex((s) => s.id === draft.id);
        if (idx >= 0) {
          sub = { ...list[idx], ...draft, updated_at: new Date().toISOString() } as Submission;
          list[idx] = sub;
        } else {
          sub = {
            id: draft.id,
            student_id: studentId,
            assignment_id: draft.assignment_id || null,
            title: draft.title || 'Untitled Project',
            description: draft.description || '',
            skills_claimed: draft.skills_claimed || [],
            video_url: draft.video_url || null,
            video_duration_seconds: draft.video_duration_seconds,
            video_size_bytes: draft.video_size_bytes,
            video_source: draft.video_source || 'none',
            documents: draft.documents || [],
            live_url: draft.live_url || null,
            github_url: draft.github_url || null,
            originality_responses: draft.originality_responses || [],
            ai_used: draft.ai_used || false,
            ai_tools: draft.ai_tools || [],
            ai_notes: draft.ai_notes || '',
            status: 'draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          list.unshift(sub);
        }
      } else {
        const id = `sub-${Date.now()}`;
        sub = {
          id,
          student_id: studentId,
          assignment_id: draft.assignment_id || null,
          title: draft.title || 'Untitled Project',
          description: draft.description || '',
          skills_claimed: draft.skills_claimed || [],
          video_url: draft.video_url || null,
          video_duration_seconds: draft.video_duration_seconds,
          video_size_bytes: draft.video_size_bytes,
          video_source: draft.video_source || 'none',
          documents: draft.documents || [],
          live_url: draft.live_url || null,
          github_url: draft.github_url || null,
          originality_responses: draft.originality_responses || [],
          ai_used: draft.ai_used || false,
          ai_tools: draft.ai_tools || [],
          ai_notes: draft.ai_notes || '',
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        list.unshift(sub);
      }

      this.state.submissions[studentId] = list;
      this.saveState(this.state);
      return sub;
    },
    submitProject: async (params: {
      submission_id: string;
      confirm: boolean;
    }): Promise<{ run_id: string; status: string; mode: string }> => {
      await this.sleep(400);
      const sub = await this.submissions.getSubmission(params.submission_id);
      if (!sub) throw new Error('Submission not found');

      // Gating checks
      if (!sub.video_url && sub.video_source === 'none') {
        const err = new Error('Add your demo video or a video link before submitting.');
        Object.assign(err, { code: 'VIDEO_REQUIRED' });
        throw err;
      }
      if (!sub.skills_claimed || sub.skills_claimed.length === 0) {
        const err = new Error('Choose at least one skill this project shows.');
        Object.assign(err, { code: 'MISSING_SKILLS' });
        throw err;
      }

      sub.status = 'auditing';
      this.saveState(this.state);

      const runId = `run-${Date.now()}`;
      const isSlow = sub.title.includes('[slow]');
      const isFail = sub.title.includes('[fail]');

      const run: AgentRun = {
        id: runId,
        submission_id: sub.id,
        stage: 'received',
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.runsStore.set(sub.id, run);
      bus.emit(`run_${sub.id}`, run);

      // Start asynchronous simulated review
      this.runSimulatedReview(sub, run, isSlow, isFail);

      return { run_id: runId, status: 'auditing', mode: 'mock' };
    },
    retrySubmission: async (
      submissionId: string
    ): Promise<{ run_id: string; status: string }> => {
      return this.submissions.submitProject({ submission_id: submissionId, confirm: true });
    },
  };

  private async runSimulatedReview(
    sub: Submission,
    run: AgentRun,
    isSlow: boolean,
    isFail: boolean
  ) {
    const stepDelay = isSlow ? 6000 : 2000;
    const stages: AgentRun['stage'][] = [
      'reading',
      'watching',
      'scoring',
      'writing',
      'done',
    ];

    for (let i = 0; i < stages.length; i++) {
      await new Promise((r) => setTimeout(r, stepDelay));

      if (isFail && i === 2) {
        run.stage = 'watching';
        run.status = 'failed';
        run.error = 'We couldn\'t finish the review. Retry now, or contact support if it happens again.';
        run.updated_at = new Date().toISOString();
        sub.status = 'failed';
        this.saveState(this.state);
        bus.emit(`run_${sub.id}`, run);
        return;
      }

      run.stage = stages[i];
      run.updated_at = new Date().toISOString();
      bus.emit(`run_${sub.id}`, run);
    }

    run.status = 'completed';

    // Generate deterministic audit from hash of title + description
    const hash = simpleHash(sub.title + (sub.description || ''));
    // Generate a realistic score between 55 and 88
    const baseScore = 65 + (hash % 24);
    const isBorder = isBorderline(baseScore);

    const primarySkill = sub.skills_claimed[0] || 'React';
    const auditId = `audit-${Date.now()}`;

    const criteria: AuditCriterion[] = [
      {
        name: 'Functionality & State',
        weight: 25,
        score: Math.min(100, baseScore + (hash % 5) - 2),
        rationale: 'Clean component state and functional flow matching project requirements.',
        evidence_refs: ['live-site', 'src-code'],
      },
      {
        name: 'Code Quality & Structure',
        weight: 20,
        score: Math.min(100, baseScore + ((hash >> 2) % 6) - 3),
        rationale: 'Solid modular organization with strong typing and concise helper utilities.',
        evidence_refs: ['src-code'],
      },
      {
        name: 'UI, UX & Accessibility',
        weight: 15,
        score: Math.min(100, baseScore + ((hash >> 3) % 6) - 2),
        rationale: 'Semantic HTML tags, active keyboard navigation, and responsive scaling.',
        evidence_refs: ['video-demo'],
      },
      {
        name: 'Testing & Reliability',
        weight: 10,
        score: Math.min(100, baseScore - 5),
        rationale: 'Unit tests present for core business logic; integration paths well handled.',
        evidence_refs: ['test-spec'],
      },
      {
        name: 'Documentation',
        weight: 10,
        score: Math.min(100, baseScore + 2),
        rationale: 'Clear README with architecture notes and reproducible local instructions.',
        evidence_refs: ['readme-doc'],
      },
      {
        name: 'Problem Solving & Depth',
        weight: 10,
        score: Math.min(100, baseScore + 3),
        rationale: 'Clear rationale provided for key data structures and error fallback logic.',
        evidence_refs: ['src-code'],
      },
      {
        name: 'Communication (Video)',
        weight: 10,
        score: Math.min(100, baseScore + 1),
        rationale: '3-minute video covers architectural decisions and demonstrates accessibility.',
        evidence_refs: ['video-demo'],
      },
    ];

    const audit: Audit = {
      id: auditId,
      submission_id: sub.id,
      created_at: new Date().toISOString(),
      overall: baseScore,
      confidence: 0.88,
      summary: `Verified review for ${sub.title}. Demonstrates clear grasp of ${primarySkill} architecture, reliable state transitions, and accessible UI interactions.`,
      next_steps: [
        `Deepen test coverage around asynchronous failure states in ${primarySkill}`,
        'Explore client-side caching or service worker optimizations',
        'Add comprehensive automated accessibility checks in continuous integration',
      ],
      flags: [],
      borderline: isBorder,
      review_status: isBorder ? 'pending' : 'none',
      per_skill: [
        {
          skill_id: `s-${primarySkill.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          score: baseScore,
          criteria,
        },
      ],
      evidence: [
        {
          ref: 'video-demo',
          kind: 'video',
          label: 'Video 01:15',
          pointer: '75',
          excerpt: 'Demonstrating keyboard navigation and live state transitions.',
        },
        {
          ref: 'src-code',
          kind: 'repo',
          label: 'src/main.tsx',
          pointer: 'src/main.tsx#L10-L45',
          excerpt: 'Core component structure and reactive hooks implementation.',
        },
        {
          ref: 'test-spec',
          kind: 'repo',
          label: 'tests/core.test.ts',
          pointer: 'tests/core.test.ts#L1-L25',
          excerpt: 'Unit tests covering filter state assertions.',
        },
        {
          ref: 'readme-doc',
          kind: 'doc',
          label: 'README.md',
          pointer: 'README.md#L1-L15',
          excerpt: 'Project architecture summary and setup commands.',
        },
        {
          ref: 'live-site',
          kind: 'live',
          label: 'Live site',
          pointer: sub.live_url || 'https://demo.aptohire.test',
          excerpt: 'Verified deployed build.',
        },
      ],
      transcript: [
        { t: 0, text: 'Hello, welcome to the demo of my project.' },
        { t: 45, text: 'Here I walk through the architecture and how state is preserved.' },
        { t: 75, text: 'Demonstrating keyboard navigation and live state transitions.' },
        { t: 120, text: 'Finally, here is the error boundary handling simulated failures.' },
      ],
    };

    this.auditsStore.set(sub.id, audit);
    this.auditsStore.set(auditId, audit);

    // Update submission status
    sub.status = isBorder ? 'needs_review' : 'scored';

    // Update SkillScore
    const studentScores = this.state.skillScores[sub.student_id] || [];
    const skillSlug = primarySkill.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existingScoreIdx = studentScores.findIndex((s) => s.skill_slug === skillSlug);

    const newSkillScore: SkillScore = {
      id: `score-${Date.now()}`,
      student_id: sub.student_id,
      skill_id: `s-${skillSlug}`,
      skill_name: primarySkill,
      skill_slug: skillSlug,
      family: 'Web/Frontend',
      score: baseScore,
      level: levelFor(baseScore),
      is_verified: isVerified(baseScore),
      is_borderline: isBorder,
      last_reviewed_at: new Date().toISOString(),
      audit_id: auditId,
    };

    if (existingScoreIdx >= 0) {
      studentScores[existingScoreIdx] = newSkillScore;
    } else {
      studentScores.unshift(newSkillScore);
    }
    this.state.skillScores[sub.student_id] = studentScores;

    // Append to score history
    const history = this.state.scoreHistory[sub.student_id] || [];
    history.push({
      id: `hist-${Date.now()}`,
      student_id: sub.student_id,
      skill_id: `s-${skillSlug}`,
      score: baseScore,
      audit_id: auditId,
      created_at: new Date().toISOString(),
    });
    this.state.scoreHistory[sub.student_id] = history;

    // Send notification
    const userNotifs = this.state.notifications[sub.student_id] || [];
    userNotifs.unshift({
      id: `notif-${Date.now()}`,
      student_id: sub.student_id,
      kind: 'audit_ready',
      title: `Your ${primarySkill} score is ready`,
      body: `You scored ${baseScore} (${levelFor(baseScore)}). Review your evidence trail.`,
      read_at: null,
      created_at: new Date().toISOString(),
      link: `/scorecard/${skillSlug}`,
    });
    this.state.notifications[sub.student_id] = userNotifs;

    this.saveState(this.state);
    bus.emit(`run_${sub.id}`, run);
  }

  // ---------------- UPLOADS ----------------
  uploads = {
    uploadVideoTus: async (
      file: File,
      submissionId: string,
      onProgress?: (percent: number) => void
    ): Promise<{ url: string; duration: number; size: number }> => {
      // Simulate chunked upload progress
      for (let p = 10; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 120));
        if (onProgress) onProgress(p);
      }
      return {
        url: `mock-storage://videos/${submissionId}/demo.${file.name.split('.').pop()}`,
        duration: 172,
        size: file.size,
      };
    },
    uploadDocument: async (
      file: File,
      _submissionId: string
    ): Promise<SubmissionDocument> => {
      await this.sleep(300);
      return {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        url: `mock-storage://documents/${file.name}`,
        ext: file.name.split('.').pop()?.toLowerCase() || 'md',
      };
    },
    getSignedPlaybackUrl: async (
      _submissionId: string,
      _path: string
    ): Promise<string> => {
      await this.sleep(100);
      return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    },
    getSignedDocumentUrl: async (
      _submissionId: string,
      path: string
    ): Promise<string> => {
      await this.sleep(100);
      return `mock-signed-url://${path}?expires=${Date.now() + 600000}`;
    },
  };

  // ---------------- AUDITS ----------------
  audits = {
    getAudit: async (submissionId: string): Promise<Audit | null> => {
      await this.sleep(150);
      return this.auditsStore.get(submissionId) || null;
    },
    getAgentRun: async (submissionId: string): Promise<AgentRun | null> => {
      await this.sleep(100);
      return this.runsStore.get(submissionId) || null;
    },
    subscribeAgentRun: (
      submissionId: string,
      onUpdate: (run: AgentRun) => void
    ): () => void => {
      return bus.on(`run_${submissionId}`, onUpdate);
    },
  };

  // ---------------- SCORES ----------------
  scores = {
    listSkillScores: async (studentId: string): Promise<SkillScore[]> => {
      await this.sleep(200);
      return this.state.skillScores[studentId] || [];
    },
    getSkillScore: async (
      studentId: string,
      skillSlug: string
    ): Promise<SkillScore | null> => {
      await this.sleep(150);
      const cleanSlug = (skillSlug || '').toLowerCase().replace(/[-_\s]/g, '');
      const list = this.state.skillScores[studentId] || [];
      const found = list.find(
        (s) =>
          s.skill_slug.toLowerCase().replace(/[-_\s]/g, '') === cleanSlug ||
          s.skill_name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug
      );
      if (found) return found;

      // Cross-persona fallback: If current student hasn't verified this skill,
      // return the verified benchmark from other seed students (e.g. Avi's SQL, Aarav's React, Niya's Market Analysis)
      for (const otherStudentId of Object.keys(this.state.skillScores)) {
        const otherList = this.state.skillScores[otherStudentId] || [];
        const otherFound = otherList.find(
          (s) =>
            s.skill_slug.toLowerCase().replace(/[-_\s]/g, '') === cleanSlug ||
            s.skill_name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug
        );
        if (otherFound) {
          return otherFound;
        }
      }

      // Taxonomy fallback: If skill exists in taxonomy, generate a calibrated benchmark score
      const skillTax = SEED_SKILLS.find(
        (sk) =>
          sk.slug.toLowerCase().replace(/[-_\s]/g, '') === cleanSlug ||
          sk.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanSlug
      );
      if (skillTax) {
        return {
          id: `score-benchmark-${skillTax.slug}`,
          student_id: studentId,
          skill_id: skillTax.id,
          skill_name: skillTax.name,
          skill_slug: skillTax.slug,
          family: skillTax.family,
          score: 76,
          level: 'Proficient',
          is_verified: true,
          is_borderline: false,
          last_reviewed_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          audit_id: `audit-${skillTax.slug}`,
        };
      }

      return null;
    },
    listScoreHistory: async (
      studentId: string,
      skillId?: string
    ): Promise<SkillScoreHistory[]> => {
      await this.sleep(150);
      const list = this.state.scoreHistory[studentId] || [];
      if (skillId) {
        return list.filter((h) => h.skill_id === skillId);
      }
      return list;
    },
  };

  // ---------------- TICKETS (APPEALS) ----------------
  tickets = {
    listTickets: async (studentId: string): Promise<Ticket[]> => {
      await this.sleep(150);
      return this.ticketsStore.get(studentId) || [];
    },
    createTicket: async (
      input: TicketFormInput & { student_id: string }
    ): Promise<Ticket> => {
      await this.sleep(300);
      const ticket: Ticket = {
        id: `tkt-${Date.now()}`,
        student_id: input.student_id,
        submission_id: input.submission_id,
        skill_name: input.skill_name,
        reason: input.reason,
        status: 'received',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const existing = this.ticketsStore.get(input.student_id) || [];
      existing.unshift(ticket);
      this.ticketsStore.set(input.student_id, existing);

      // Mark submission as appealed
      const sub = await this.submissions.getSubmission(input.submission_id);
      if (sub) {
        sub.status = 'appealed';
        this.saveState(this.state);
      }

      return ticket;
    },
  };

  // ---------------- SOURCES ----------------
  sources = {
    listSources: async (studentId: string): Promise<ProfileSource[]> => {
      await this.sleep(150);
      return this.state.sources[studentId] || [];
    },
    updateSourceConsent: async (
      studentId: string,
      sourceId: string,
      consent: boolean,
      autoApprove?: boolean
    ): Promise<ProfileSource> => {
      await this.sleep(200);
      const list = this.state.sources[studentId] || [];
      const item = list.find((s) => s.id === sourceId);
      if (!item) throw new Error('Source not found');
      item.consent_granted = consent;
      if (autoApprove !== undefined) item.auto_approve_proposals = autoApprove;
      this.saveState(this.state);
      return item;
    },
    syncSource: async (
      studentId: string,
      source: 'github' | 'linkedin' | 'manual',
      _payload?: unknown
    ): Promise<{ proposals?: ProfileProposal[]; last_synced_at: string }> => {
      await this.sleep(450);
      const list = this.state.sources[studentId] || [];
      const item = list.find((s) => s.source === source);
      const now = new Date().toISOString();
      if (item) {
        item.last_synced_at = now;
        item.connected = true;
      }
      this.saveState(this.state);

      const proposals: ProfileProposal[] = [
        {
          source: source === 'linkedin' ? 'linkedin_export' : 'github',
          changes: [
            {
              field: 'skills_interest',
              action: 'add',
              value: 'GraphQL',
              evidence: `Derived from ${source} activity`,
            },
            {
              field: 'headline',
              action: 'update',
              value: 'Full Stack Engineer | React & Distributed Systems',
              evidence: `Updated headline found in ${source}`,
            },
          ],
        },
      ];
      this.proposalSuggestions.set(studentId, proposals);

      return { proposals, last_synced_at: now };
    },
    disconnectSource: async (
      studentId: string,
      sourceId: string,
      _deleteDerivedData?: boolean
    ): Promise<void> => {
      await this.sleep(300);
      const list = this.state.sources[studentId] || [];
      const item = list.find((s) => s.id === sourceId);
      if (item) {
        item.connected = false;
        item.consent_granted = false;
        this.saveState(this.state);
      }
    },
    listProposals: async (studentId: string): Promise<ProfileProposal[]> => {
      await this.sleep(150);
      return this.proposalSuggestions.get(studentId) || [];
    },
    applyProposal: async (studentId: string, proposalIndex: number): Promise<void> => {
      await this.sleep(200);
      const proposals = this.proposalSuggestions.get(studentId) || [];
      const proposal = proposals[proposalIndex];
      if (proposal) {
        const profile = await this.student.getProfile(studentId);
        proposal.changes.forEach((c) => {
          if (c.field === 'headline') profile.headline = c.value as string;
          if (c.field === 'skills_interest') {
            profile.target_skills = Array.from(
              new Set([...profile.target_skills, c.value as string])
            );
          }
        });
        this.saveState(this.state);
        proposals.splice(proposalIndex, 1);
        this.proposalSuggestions.set(studentId, proposals);
      }
    },
    dismissProposal: async (studentId: string, proposalIndex: number): Promise<void> => {
      await this.sleep(150);
      const proposals = this.proposalSuggestions.get(studentId) || [];
      proposals.splice(proposalIndex, 1);
      this.proposalSuggestions.set(studentId, proposals);
    },
  };

  // ---------------- SHARING ----------------
  sharing = {
    listAccessRequests: async (studentId: string): Promise<AccessRequest[]> => {
      await this.sleep(200);
      return this.state.accessRequests[studentId] || [];
    },
    respondAccess: async (
      input: RespondAccessInput
    ): Promise<{ status: string; expires_at?: string }> => {
      await this.sleep(300);
      let found: AccessRequest | undefined;
      for (const list of Object.values(this.state.accessRequests)) {
        found = list.find((r) => r.id === input.request_id);
        if (found) break;
      }
      if (!found) throw new Error('Request not found');

      if (input.decision === 'accept') {
        found.status = 'accepted';
        found.granted_scopes = input.granted_scope || ['profile'];
        const days = input.duration_days || 30;
        const expires = new Date(Date.now() + days * 86400000).toISOString();
        found.expires_at = expires;
        this.saveState(this.state);
        return { status: 'accepted', expires_at: expires };
      } else {
        found.status = 'declined';
        this.saveState(this.state);
        return { status: 'declined' };
      }
    },
    withdrawAccess: async (requestId: string): Promise<{ status: 'withdrawn' }> => {
      await this.sleep(250);
      for (const list of Object.values(this.state.accessRequests)) {
        const found = list.find((r) => r.id === requestId);
        if (found) {
          found.status = 'withdrawn';
          this.saveState(this.state);
          return { status: 'withdrawn' };
        }
      }
      return { status: 'withdrawn' };
    },
    listFeedback: async (studentId: string): Promise<FeedbackItem[]> => {
      await this.sleep(150);
      return this.state.feedback[studentId] || [];
    },
    subscribeAccessRequests: (
      _studentId: string,
      _onRequestChange: (request: AccessRequest) => void
    ): () => void => {
      return () => {};
    },
  };

  // ---------------- NOTIFICATIONS ----------------
  notifications = {
    listNotifications: async (studentId: string): Promise<NotificationItem[]> => {
      await this.sleep(150);
      return this.state.notifications[studentId] || [];
    },
    markNotificationRead: async (notificationId: string): Promise<void> => {
      await this.sleep(100);
      for (const list of Object.values(this.state.notifications)) {
        const found = list.find((n) => n.id === notificationId);
        if (found) {
          found.read_at = new Date().toISOString();
          this.saveState(this.state);
          return;
        }
      }
    },
    markAllNotificationsRead: async (studentId: string): Promise<void> => {
      await this.sleep(150);
      const list = this.state.notifications[studentId] || [];
      const now = new Date().toISOString();
      list.forEach((n) => {
        if (!n.read_at) n.read_at = now;
      });
      this.saveState(this.state);
    },
    subscribeNotifications: (
      _studentId: string,
      onNotification: (item: NotificationItem) => void
    ): () => void => {
      return bus.on('notification_received', onNotification);
    },
  };

  // ---------------- CONFIG ----------------
  config = {
    getPublicConfig: async (): Promise<PublicConfig> => {
      await this.sleep(100);
      return {
        pass_mark: 50,
        borderline_low: 40,
        borderline_high: 60,
        require_video: true,
        video_max_mb: 50,
        video_max_seconds: 190,
        ai_kill_switch: false,
        ai_daily_cap_per_user: 5,
      };
    },
  };

  // ---------------- ACCOUNT ----------------
  account = {
    exportMyData: async (studentId: string): Promise<{ signed_url: string }> => {
      await this.sleep(400);
      return { signed_url: `mock-download://${studentId}-data-export.json` };
    },
    deleteMyAccount: async (
      studentId: string,
      confirm: string,
      _password?: string
    ): Promise<void> => {
      await this.sleep(500);
      if (confirm !== 'DELETE') throw new Error('Confirmation string mismatch');
      delete this.state.profiles[studentId];
      delete this.state.affiliations[studentId];
      delete this.state.submissions[studentId];
      delete this.state.skillScores[studentId];
      this.saveState(this.state);
      this.setSessionUser(null);
    },
    resetDemoData: async (): Promise<void> => {
      await this.sleep(200);
      try {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        clearAuthSession();
      } catch {
        // ignore
      }
      this.state = getInitialSeedState();
      this.seedAudits();
      this.saveState(this.state);
      this.setSessionUser(MOCK_USERS[0]);
    },
  };
}
