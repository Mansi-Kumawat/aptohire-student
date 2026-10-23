-- ==============================================================================
-- AptoHire Database Schema: Core Entities, Indexes & Extensions
-- Spec: architecture.md §6
-- ==============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enum Types
CREATE TYPE app_role AS ENUM ('student', 'university', 'organization', 'admin');
CREATE TYPE uni_status AS ENUM ('pending', 'approved', 'rejected', 'unregistered');
CREATE TYPE life_status AS ENUM ('incoming', 'enrolled', 'dropout', 'alumni', 'masters');
CREATE TYPE verify_level AS ENUM ('roster', 'student_id', 'unverified');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'auditing', 'scored', 'needs_review', 'appealed', 'failed');
CREATE TYPE agent_kind AS ENUM ('audit', 'assign', 'match', 'jd_extract', 'profile');

-- 1. Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Students (Permanent person record independent of auth & affiliations)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  primary_email CITEXT,
  photo_path TEXT,
  headline TEXT,
  bio TEXT,
  credential_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(9), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Universities & Members
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  tier TEXT CHECK (tier IN ('tier1', 'tier2', 'tier3', 'other')),
  kind TEXT,
  city TEXT,
  state TEXT,
  email_domains TEXT[] DEFAULT '{}',
  status uni_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS university_members (
  university_id UUID REFERENCES universities ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  member_role TEXT DEFAULT 'tpo',
  PRIMARY KEY (university_id, user_id)
);

-- 4. Rosters (University-owned, never edited by student)
CREATE TABLE IF NOT EXISTS roster_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email CITEXT,
  student_id_hash TEXT,
  program TEXT,
  program_level TEXT DEFAULT 'ug',
  claimed_student_id UUID REFERENCES students,
  UNIQUE (university_id, student_id_hash)
);

-- 5. Affiliations (Platform-owned link; preserves history upon transfer or grad)
CREATE TABLE IF NOT EXISTS affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  university_id UUID REFERENCES universities,
  university_name_text TEXT,
  program_level TEXT DEFAULT 'ug',
  year INT DEFAULT 1,
  status life_status DEFAULT 'enrolled',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_type verify_level DEFAULT 'unverified',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Skills & Knowledge Graph Edges
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  family TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS skill_edges (
  a UUID REFERENCES skills ON DELETE CASCADE,
  b UUID REFERENCES skills ON DELETE CASCADE,
  weight REAL DEFAULT 1.0,
  PRIMARY KEY (a, b)
);

-- 7. Project Templates & Assignments
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family TEXT NOT NULL,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  brief JSONB NOT NULL,
  rubric JSONB NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  template_id UUID REFERENCES project_templates,
  target_skills UUID[] NOT NULL,
  level TEXT,
  brief JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Submissions, Agent Runs & Audits
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  assignment_id UUID REFERENCES project_assignments,
  title TEXT NOT NULL,
  description TEXT,
  skills_claimed UUID[] NOT NULL,
  live_url TEXT,
  github_url TEXT,
  video_url TEXT,
  video_source TEXT DEFAULT 'none',
  video_duration_seconds INT,
  documents JSONB DEFAULT '[]'::jsonb,
  originality_responses JSONB DEFAULT '[]'::jsonb,
  ai_used BOOLEAN DEFAULT FALSE,
  ai_tools TEXT[] DEFAULT '{}',
  ai_notes TEXT,
  status submission_status DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind agent_kind NOT NULL,
  mode TEXT NOT NULL,
  subject_type TEXT,
  subject_id UUID,
  status TEXT DEFAULT 'queued',
  input_hash TEXT,
  tokens_est INT,
  latency_ms INT,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions ON DELETE CASCADE,
  run_id UUID REFERENCES agent_runs,
  rubric_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  overall_score INT NOT NULL,
  confidence REAL NOT NULL,
  level TEXT NOT NULL,
  criteria_breakdown JSONB NOT NULL,
  evidence_spans JSONB NOT NULL,
  review_status TEXT DEFAULT 'none',
  reviewed_by UUID REFERENCES auth.users,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skill_scores (
  student_id UUID REFERENCES students ON DELETE CASCADE,
  skill_id UUID REFERENCES skills ON DELETE CASCADE,
  score INT NOT NULL,
  level TEXT NOT NULL,
  verified BOOLEAN NOT NULL,
  confidence REAL,
  best_audit_id UUID REFERENCES audits,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (student_id, skill_id)
);

CREATE TABLE IF NOT EXISTS skill_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills ON DELETE CASCADE,
  score INT NOT NULL,
  audit_id UUID REFERENCES audits,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Profile Sources, Tickets, Organizations, Jobs & Candidate Projections
CREATE TABLE IF NOT EXISTS profile_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students ON DELETE CASCADE,
  kind TEXT CHECK (kind IN ('github', 'linkedin_export', 'manual')),
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  consent_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  token_secret_id UUID,
  data JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions,
  skill_name TEXT,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'received',
  assigned_to UUID REFERENCES auth.users,
  ack_at TIMESTAMPTZ,
  decision TEXT,
  decision_note TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  size TEXT,
  kind TEXT,
  website TEXT,
  status TEXT DEFAULT 'pending',
  subscription_status TEXT DEFAULT 'inactive',
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id UUID REFERENCES organizations ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  member_role TEXT DEFAULT 'recruiter',
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required_skills JSONB NOT NULL,
  mode TEXT,
  location TEXT,
  openings INT DEFAULT 1,
  embedding vector(768),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_profiles (
  student_id UUID PRIMARY KEY REFERENCES students ON DELETE CASCADE,
  uni_category TEXT,
  skills JSONB NOT NULL,
  scrubbed_summary TEXT,
  study_stage TEXT,
  project_count INT DEFAULT 0,
  discoverable BOOLEAN DEFAULT TRUE,
  embedding vector(768),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  alias TEXT NOT NULL,
  structured_score REAL,
  vector_score REAL,
  final_score REAL,
  confidence REAL,
  reasons JSONB,
  gaps JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, student_id)
);

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations,
  job_id UUID REFERENCES jobs,
  match_result_id UUID REFERENCES match_results,
  student_id UUID NOT NULL REFERENCES students,
  message TEXT,
  requested_scopes TEXT[] NOT NULL,
  duration_days INT DEFAULT 30,
  status TEXT DEFAULT 'pending',
  granted_scopes TEXT[],
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations,
  student_id UUID REFERENCES students,
  job_id UUID REFERENCES jobs,
  option_codes TEXT[] NOT NULL,
  note TEXT CHECK (char_length(note) <= 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_role app_role,
  action TEXT NOT NULL,
  subject_type TEXT,
  subject_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_audits_submission ON audits(submission_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_student ON access_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
