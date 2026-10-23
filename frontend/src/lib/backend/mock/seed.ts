import {
  AccessRequest,
  Affiliation,
  AffiliationProposal,
  FeedbackItem,
  NotificationItem,
  ProfileSource,
  ProjectAssignment,
  SkillEdge,
  SkillItem,
  SkillScore,
  SkillScoreHistory,
  StudentProfile,
  Submission,
  UniversityPublic,
} from '../../domain/types';
import { AuthUser } from '../types';

export const SEED_UNIVERSITIES: UniversityPublic[] = [
  {
    id: 'uni-a',
    name: 'Uni A (Apex Institute of Technology)',
    slug: 'uni-a',
    email_domains: ['unia.edu.test', 'apex.edu.test'],
  },
  {
    id: 'uni-b',
    name: 'Uni B (Beacon State University)',
    slug: 'uni-b',
    email_domains: ['unib.edu.test', 'beacon.edu.test'],
  },
  {
    id: 'uni-c',
    name: 'Uni C (Crestview University)',
    slug: 'uni-c',
    email_domains: ['unic.edu.test'],
  },
];

export const SEED_SKILLS: SkillItem[] = [
  // Web/Frontend
  { id: 's-react', name: 'React', slug: 'react', family: 'Web/Frontend' },
  { id: 's-ts', name: 'TypeScript', slug: 'typescript', family: 'Web/Frontend' },
  { id: 's-js', name: 'JavaScript', slug: 'javascript', family: 'Web/Frontend' },
  { id: 's-htmlcss', name: 'HTML/CSS', slug: 'html-css', family: 'Web/Frontend' },
  { id: 's-a11y', name: 'Accessibility', slug: 'accessibility', family: 'Web/Frontend' },
  { id: 's-api', name: 'API integration', slug: 'api-integration', family: 'Web/Frontend' },
  { id: 's-test', name: 'Testing', slug: 'testing', family: 'Web/Frontend' },
  // Backend
  { id: 's-node', name: 'Node.js', slug: 'nodejs', family: 'Backend' },
  { id: 's-python', name: 'Python', slug: 'python', family: 'Backend' },
  { id: 's-sql', name: 'SQL', slug: 'sql', family: 'Backend' },
  { id: 's-rest', name: 'REST design', slug: 'rest-design', family: 'Backend' },
  { id: 's-auth', name: 'Auth', slug: 'auth', family: 'Backend' },
  // Data
  { id: 's-sqldata', name: 'SQL analytics', slug: 'sql-analytics', family: 'Data' },
  { id: 's-pandas', name: 'Python/Pandas', slug: 'python-pandas', family: 'Data' },
  { id: 's-vis', name: 'Visualization', slug: 'visualization', family: 'Data' },
  { id: 's-ml', name: 'ML basics', slug: 'ml-basics', family: 'Data' },
  // Management/Commerce
  { id: 's-market', name: 'Market analysis', slug: 'market-analysis', family: 'Management/Commerce' },
  { id: 's-fin', name: 'Financial modelling', slug: 'financial-modelling', family: 'Management/Commerce' },
  { id: 's-proj', name: 'Project planning', slug: 'project-planning', family: 'Management/Commerce' },
  { id: 's-comm', name: 'Communication', slug: 'communication', family: 'Management/Commerce' },
];

export const SEED_SKILL_EDGES: SkillEdge[] = [
  { source: 'React', target: 'JavaScript' },
  { source: 'React', target: 'TypeScript' },
  { source: 'TypeScript', target: 'JavaScript' },
  { source: 'React', target: 'Testing' },
  { source: 'Accessibility', target: 'HTML/CSS' },
  { source: 'API integration', target: 'JavaScript' },
  { source: 'Node.js', target: 'REST design' },
  { source: 'Node.js', target: 'Auth' },
  { source: 'Node.js', target: 'SQL' },
  { source: 'Python/Pandas', target: 'Python' },
  { source: 'SQL analytics', target: 'SQL' },
  { source: 'Visualization', target: 'Python/Pandas' },
  { source: 'Market analysis', target: 'Financial modelling' },
  { source: 'Project planning', target: 'Communication' },
];

export const MOCK_USERS: AuthUser[] = [
  {
    id: 'user-aarav',
    email: 'aarav@unia.edu.test',
    role: 'student',
    full_name: 'Aarav Sharma',
  },
  {
    id: 'user-naman',
    email: 'naman@demo.aptohire.test',
    role: 'student',
    full_name: 'Naman Patel',
  },
  {
    id: 'user-avi',
    email: 'avi@demo.aptohire.test',
    role: 'student',
    full_name: 'Avi Verma',
  },
  {
    id: 'user-niya',
    email: 'niya@demo.aptohire.test',
    role: 'student',
    full_name: 'Niya Sen',
  },
  // Non-student test users for role guard testing
  {
    id: 'user-uni',
    email: 'uni-staff@unia.edu.test',
    role: 'university',
    full_name: 'Prof. Miller',
  },
  {
    id: 'user-org',
    email: 'recruiter@northwind.test',
    role: 'organization',
    full_name: 'Northwind Recruiter',
  },
  {
    id: 'user-admin',
    email: 'admin@aptohire.test',
    role: 'admin',
    full_name: 'System Admin',
  },
];

export function getInitialSeedState() {
  const profiles: Record<string, StudentProfile> = {
    'user-aarav': {
      id: 'user-aarav',
      full_name: 'Aarav Sharma',
      email: 'aarav@unia.edu.test',
      credential_id: 'APT-8924-ARV',
      headline: 'Frontend Engineer focused on React & TypeScript performance',
      bio: 'Second-year undergraduate passionate about building accessible design systems and robust web applications with verifiable skills.',
      location: 'Bengaluru, India',
      languages: ['English', 'Hindi'],
      links: {
        github: 'https://github.com/aarav-dev',
        linkedin: 'https://linkedin.com/in/aarav-sharma-fictional',
        portfolio: 'https://aarav.dev.test',
      },
      target_skills: ['React', 'TypeScript', 'Accessibility'],
      target_roles: ['Frontend Developer', 'UI Engineer'],
      visibility: {
        public_skills: true,
        public_levels: true,
        public_scores: true,
        public_name: true,
        public_university: true,
        discovery_opt_in: true,
      },
    },
    'user-naman': {
      id: 'user-naman',
      full_name: 'Naman Patel',
      email: 'naman@demo.aptohire.test',
      credential_id: 'APT-1042-NAM',
      headline: 'Aspiring Web Developer',
      bio: 'Learning full-stack development and eager to tackle first projects.',
      location: 'Mumbai, India',
      languages: ['English', 'Gujarati'],
      links: {},
      target_skills: ['JavaScript', 'HTML/CSS'],
      target_roles: ['Junior Developer'],
      visibility: {
        public_skills: true,
        public_levels: true,
        public_scores: false,
        public_name: false,
        public_university: false,
        discovery_opt_in: true,
      },
    },
    'user-avi': {
      id: 'user-avi',
      full_name: 'Avi Verma',
      email: 'avi@demo.aptohire.test',
      credential_id: 'APT-4419-AVI',
      headline: 'Data Engineer & SQL Specialist',
      bio: 'Alumnus of Uni A, pursuing advanced distributed data systems.',
      location: 'Pune, India',
      languages: ['English'],
      links: { github: 'https://github.com/avi-data' },
      target_skills: ['SQL', 'Python/Pandas'],
      target_roles: ['Data Engineer'],
      visibility: {
        public_skills: true,
        public_levels: true,
        public_scores: true,
        public_name: true,
        public_university: true,
        discovery_opt_in: true,
      },
    },
    'user-niya': {
      id: 'user-niya',
      full_name: 'Niya Sen',
      email: 'niya@demo.aptohire.test',
      credential_id: 'APT-6021-NIY',
      headline: 'Product Analyst',
      bio: 'Transitioning into analytics; university unverified but scores verified.',
      location: 'Delhi, India',
      languages: ['English', 'Bengali'],
      links: {},
      target_skills: ['Market analysis', 'Communication'],
      target_roles: ['Product Analyst'],
      visibility: {
        public_skills: true,
        public_levels: true,
        public_scores: true,
        public_name: false,
        public_university: false,
        discovery_opt_in: true,
      },
    },
  };

  const affiliations: Record<string, Affiliation[]> = {
    'user-aarav': [
      {
        id: 'aff-aarav-1',
        student_id: 'user-aarav',
        university_id: 'uni-a',
        university_name: 'Uni A (Apex Institute of Technology)',
        program_level: 'ug',
        year: 2,
        status: 'enrolled',
        is_verified: true,
        verification_type: 'roster',
        started_at: '2024-08-01',
        is_current: true,
      },
    ],
    'user-naman': [
      {
        id: 'aff-naman-1',
        student_id: 'user-naman',
        university_id: 'uni-b',
        university_name: 'Uni B (Beacon State University)',
        program_level: 'ug',
        year: 1,
        status: 'enrolled',
        is_verified: true,
        verification_type: 'student_id',
        started_at: '2025-08-01',
        is_current: true,
      },
    ],
    'user-avi': [
      {
        id: 'aff-avi-1',
        student_id: 'user-avi',
        university_id: 'uni-a',
        university_name: 'Uni A (Apex Institute of Technology)',
        program_level: 'ug',
        year: 4,
        status: 'alumni',
        is_verified: true,
        verification_type: 'roster',
        started_at: '2020-08-01',
        ended_at: '2024-05-30',
        is_current: false,
      },
    ],
    'user-niya': [
      {
        id: 'aff-niya-1',
        student_id: 'user-niya',
        university_id: null,
        university_name: 'Uni D (Independent Open Academy)',
        program_level: 'pg',
        year: 1,
        status: 'enrolled',
        is_verified: false,
        verification_type: 'unverified',
        started_at: '2025-01-10',
        is_current: true,
      },
      {
        id: 'aff-niya-old',
        student_id: 'user-niya',
        university_id: 'uni-b',
        university_name: 'Uni B (Beacon State University)',
        program_level: 'ug',
        year: 3,
        status: 'alumni',
        is_verified: true,
        verification_type: 'roster',
        started_at: '2021-08-01',
        ended_at: '2024-06-01',
        is_current: false,
      },
    ],
  };

  const proposals: Record<string, AffiliationProposal[]> = {
    'user-avi': [
      {
        id: 'prop-avi-unib',
        student_id: 'user-avi',
        university_id: 'uni-b',
        university_name: 'Uni B (Beacon State University)',
        program_level: 'pg',
        year: 1,
        status: 'masters',
        is_verified: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
  };

  const assignments: Record<string, ProjectAssignment[]> = {
    'user-aarav': [
      {
        id: 'asg-aarav-react',
        student_id: 'user-aarav',
        target_skill: 'React',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
        brief: {
          title: 'Interactive Filterable Product Catalog',
          scenario:
            'A specialty marketplace needs a lightning-fast catalog with faceted search, optimistic cart updates, and robust keyboard accessibility.',
          level: 'Proficient',
          target_skills: ['React', 'TypeScript', 'Accessibility'],
          deliverables: [
            'Faceted search filter component with URL query state persistence',
            'Optimistic add-to-cart drawer with rollback on error',
            'Full WCAG 2.2 AA compliant keyboard navigation and live announcements',
            '3-minute screen recording demonstrating features and edge-case handling',
          ],
          constraints: [
            'No heavy full-page UI component libraries; write accessible headless primitives',
            'TypeScript strict mode without any type assertions',
            'Sub-100ms render updates with 1,000 catalog items',
          ],
          suggested_stack: ['React', 'TypeScript', 'Tailwind CSS'],
          estimated_hours: 12,
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
            'Walk through your faceted filtering logic, demonstrate keyboard-only navigation with screen reader announcements, and explain your state rollback strategy.',
          originality_questions: [
            'How did you architect the state synchronization between URL query parameters and nested filter toggles?',
            'Where in your codebase did you encounter a non-trivial performance bottleneck and how did you resolve it?',
          ],
        },
      },
    ],
  };

  const submissions: Record<string, Submission[]> = {
    'user-aarav': [
      {
        id: 'sub-aarav-1',
        student_id: 'user-aarav',
        assignment_id: 'asg-aarav-react',
        title: 'Accessible Filterable Product Catalog',
        description:
          'High performance catalog with zero-dependency accessible combobox and live facet filtering.',
        skills_claimed: ['React', 'TypeScript'],
        video_url: 'mock-storage://videos/user-aarav/sub-aarav-1/demo.mp4',
        video_duration_seconds: 172,
        video_size_bytes: 34 * 1024 * 1024,
        video_source: 'upload',
        documents: [
          {
            id: 'doc-1',
            name: 'architecture-notes.md',
            size: 4500,
            url: 'mock-storage://docs/user-aarav/sub-aarav-1/architecture-notes.md',
            ext: 'md',
          },
        ],
        live_url: 'https://aarav-catalog-demo.test',
        github_url: 'https://github.com/aarav-dev/product-catalog',
        originality_responses: [
          {
            question:
              'How did you architect the state synchronization between URL query parameters and nested filter toggles?',
            answer:
              'I built a custom useUrlFilters hook that debounces search state while keeping category toggles immediate via URLSearchParams with popstate listeners.',
            answered_in_video: false,
          },
          {
            question:
              'Where in your codebase did you encounter a non-trivial performance bottleneck and how did you resolve it?',
            answer:
              'Filtering 1,000 items on every keystroke was causing frame drops; I memoized the inverted index and virtualized the grid list.',
            answered_in_video: true,
          },
        ],
        ai_used: true,
        ai_tools: ['GitHub Copilot', 'ChatGPT'],
        ai_notes:
          'Used Copilot for test mock fixtures; authored all custom hooks, accessible primitives and state logic myself.',
        status: 'scored',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ],
    'user-avi': [
      {
        id: 'sub-avi-1',
        student_id: 'user-avi',
        assignment_id: 'asg-avi-sql',
        title: 'High-Throughput Timeseries Analytics Engine',
        description:
          'Distributed reporting engine featuring partitioned tables, composite indexing, and sub-10ms aggregations.',
        skills_claimed: ['SQL'],
        video_url: 'mock-storage://videos/user-avi/sub-avi-1/demo.mp4',
        video_duration_seconds: 165,
        video_size_bytes: 28 * 1024 * 1024,
        video_source: 'upload',
        documents: [
          {
            id: 'doc-sql-1',
            name: 'query-optimization-notes.md',
            size: 3800,
            url: 'mock-storage://docs/user-avi/sub-avi-1/query-optimization-notes.md',
            ext: 'md',
          },
        ],
        live_url: null,
        github_url: 'https://github.com/avi-data/sql-analytics-engine',
        originality_responses: [
          {
            question: 'How did you resolve slow table scans across 5 million rows?',
            answer:
              'Implemented declarative table partitioning on timestamp and added a composite B-tree index on user_id and event_type.',
            answered_in_video: true,
          },
        ],
        ai_used: false,
        ai_tools: [],
        ai_notes: 'Authored pure SQL migrations, CTEs, and benchmarking harnesses without AI generation.',
        status: 'scored',
        created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
    ],
    'user-niya': [
      {
        id: 'sub-niya-1',
        student_id: 'user-niya',
        assignment_id: 'asg-niya-market',
        title: 'B2B SaaS Cohort Retention & Market Sizing Model',
        description:
          'Detailed market sizing and cohort retention matrix modeling expansion revenue and churn predictability.',
        skills_claimed: ['Market analysis'],
        video_url: 'mock-storage://videos/user-niya/sub-niya-1/demo.mp4',
        video_duration_seconds: 180,
        video_size_bytes: 31 * 1024 * 1024,
        video_source: 'upload',
        documents: [
          {
            id: 'doc-niya-1',
            name: 'cohort-retention-model.xlsx',
            size: 15400,
            url: 'mock-storage://docs/user-niya/sub-niya-1/cohort-retention-model.xlsx',
            ext: 'xlsx',
          },
        ],
        live_url: null,
        github_url: null,
        originality_responses: [
          {
            question: 'How did you segment churn risk in early cohorts?',
            answer:
              'Used behavioral activation milestones and net revenue retention degradation slopes.',
            answered_in_video: true,
          },
        ],
        ai_used: false,
        ai_tools: [],
        ai_notes: 'Financial model built directly from raw SaaS usage benchmarks.',
        status: 'scored',
        created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
      },
    ],
  };

  const skillScores: Record<string, SkillScore[]> = {
    'user-aarav': [
      {
        id: 'score-aarav-react',
        student_id: 'user-aarav',
        skill_id: 's-react',
        skill_name: 'React',
        skill_slug: 'react',
        family: 'Web/Frontend',
        score: 72,
        level: 'Proficient',
        is_verified: true,
        is_borderline: false,
        last_reviewed_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        audit_id: 'audit-aarav-1',
      },
      {
        id: 'score-aarav-ts',
        student_id: 'user-aarav',
        skill_id: 's-ts',
        skill_name: 'TypeScript',
        skill_slug: 'typescript',
        family: 'Web/Frontend',
        score: 58,
        level: 'Competent',
        is_verified: true,
        is_borderline: false,
        last_reviewed_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        audit_id: 'audit-aarav-1',
      },
    ],
    'user-avi': [
      {
        id: 'score-avi-sql',
        student_id: 'user-avi',
        skill_id: 's-sql',
        skill_name: 'SQL',
        skill_slug: 'sql',
        family: 'Backend',
        score: 88,
        level: 'Advanced',
        is_verified: true,
        is_borderline: false,
        last_reviewed_at: new Date(Date.now() - 86400000 * 30).toISOString(),
        audit_id: 'audit-avi-1',
      },
    ],
    'user-niya': [
      {
        id: 'score-niya-market',
        student_id: 'user-niya',
        skill_id: 's-market',
        skill_name: 'Market analysis',
        skill_slug: 'market-analysis',
        family: 'Management/Commerce',
        score: 74,
        level: 'Proficient',
        is_verified: true,
        is_borderline: false,
        last_reviewed_at: new Date(Date.now() - 86400000 * 15).toISOString(),
        audit_id: 'audit-niya-1',
      },
    ],
  };

  const scoreHistory: Record<string, SkillScoreHistory[]> = {
    'user-aarav': [
      {
        id: 'hist-1',
        student_id: 'user-aarav',
        skill_id: 's-react',
        score: 62,
        audit_id: 'audit-prev',
        created_at: new Date(Date.now() - 86400000 * 45).toISOString(),
      },
      {
        id: 'hist-2',
        student_id: 'user-aarav',
        skill_id: 's-react',
        score: 72,
        audit_id: 'audit-aarav-1',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: 'hist-3',
        student_id: 'user-aarav',
        skill_id: 's-ts',
        score: 58,
        audit_id: 'audit-aarav-1',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
    ],
  };

  const accessRequests: Record<string, AccessRequest[]> = {
    'user-aarav': [
      {
        id: 'req-northwind',
        organization_name: 'Northwind Labs',
        organization_verified: true,
        job_title: 'Junior Frontend Engineer',
        message:
          'We reviewed your verified React and TypeScript scores and were impressed with your accessible component work. We would love to evaluate your full project submissions.',
        requested_scopes: ['profile', 'scorecard'],
        duration_days: 30,
        status: 'pending',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'req-brightlane',
        organization_name: 'Brightlane',
        organization_verified: true,
        job_title: 'Frontend Developer (Design Systems)',
        message:
          'Looking for a developer skilled in React performance and accessibility.',
        requested_scopes: ['profile', 'scorecard', 'projects'],
        duration_days: 30,
        status: 'accepted',
        granted_scopes: ['profile', 'scorecard', 'projects'],
        expires_at: new Date(Date.now() + 86400000 * 20).toISOString(),
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      },
      {
        id: 'req-declined',
        organization_name: 'Global Tech Ventures',
        organization_verified: true,
        job_title: 'Full Stack Intern',
        message: 'Interested in reviewing your profile.',
        requested_scopes: ['profile'],
        duration_days: 7,
        status: 'declined',
        created_at: new Date(Date.now() - 86400000 * 25).toISOString(),
      },
      {
        id: 'req-withdrawn',
        organization_name: 'Nexus Alpha',
        organization_verified: false,
        job_title: 'Software Engineer',
        message: 'General inquiry.',
        requested_scopes: ['profile', 'contact'],
        duration_days: 90,
        status: 'withdrawn',
        created_at: new Date(Date.now() - 86400000 * 40).toISOString(),
      },
    ],
  };

  const feedback: Record<string, FeedbackItem[]> = {
    'user-aarav': [
      {
        id: 'fb-1',
        organization_name: 'Brightlane',
        job_title: 'Frontend Developer',
        category: 'Code Quality',
        label: 'Strong modular design',
        note: 'Very clear separation of headless hooks and presentational components in your catalog repo.',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
  };

  const notifications: Record<string, NotificationItem[]> = {
    'user-aarav': [
      {
        id: 'notif-1',
        student_id: 'user-aarav',
        kind: 'access_request',
        title: 'New access request from Northwind Labs',
        body: 'Northwind Labs would like to see your profile and scorecard for 30 days.',
        read_at: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        link: '/sharing',
      },
      {
        id: 'notif-2',
        student_id: 'user-aarav',
        kind: 'audit_ready',
        title: 'Your React score is ready',
        body: 'You scored 72 (Proficient). Your evidence trail has been verified.',
        read_at: null,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        link: '/scorecard/react',
      },
    ],
  };

  const sources: Record<string, ProfileSource[]> = {
    'user-aarav': [
      {
        id: 'src-gh',
        source: 'github',
        name: 'GitHub (@aarav-dev)',
        connected: true,
        consent_granted: true,
        auto_approve_proposals: false,
        last_synced_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'src-li',
        source: 'linkedin',
        name: 'LinkedIn Data Export',
        connected: false,
        consent_granted: false,
        auto_approve_proposals: false,
      },
      {
        id: 'src-man',
        source: 'manual',
        name: 'Manual Links & Portfolio',
        connected: true,
        consent_granted: true,
        auto_approve_proposals: true,
      },
    ],
  };

  return {
    profiles,
    affiliations,
    proposals,
    assignments,
    submissions,
    skillScores,
    scoreHistory,
    accessRequests,
    feedback,
    notifications,
    sources,
  };
}
