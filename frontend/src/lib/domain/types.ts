import { SkillLevel } from '../scoring';

export type Scope = 'profile' | 'scorecard' | 'projects' | 'contact';

export interface ProjectBrief {
  title: string;
  scenario: string;
  level: 'Competent' | 'Proficient' | 'Advanced';
  target_skills: string[];
  deliverables: string[];
  constraints: string[];
  suggested_stack?: string[];
  estimated_hours: number;
  rubric_preview: { criterion: string; weight: number }[];
  video_guidance: string;
  originality_questions: string[];
}

export interface EvidenceItem {
  ref: string;
  kind: 'video' | 'file' | 'repo' | 'doc' | 'live';
  label: string;
  pointer: string; // e.g. "102" for video (seconds), "src/cart.tsx#L12-L34"
  excerpt?: string;
}

export interface AuditCriterion {
  name: string;
  weight: number;
  score: number | null;
  rationale: string;
  evidence_refs: string[];
  insufficient_evidence?: boolean;
}

export interface Audit {
  id: string;
  submission_id: string;
  created_at: string;
  overall: number;
  confidence: number;
  summary: string;
  next_steps: string[];
  flags: string[];
  borderline: boolean;
  review_status: 'none' | 'pending' | 'confirmed' | 'adjusted';
  per_skill: {
    skill_id: string;
    score: number;
    criteria: AuditCriterion[];
  }[];
  evidence: EvidenceItem[];
  transcript?: { t: number; text: string }[];
}

export interface ProfileProposal {
  id?: string;
  state?: 'pending' | 'approved' | 'dismissed';
  source: 'github' | 'linkedin_export';
  changes: {
    field:
      | 'headline'
      | 'skills_interest'
      | 'experience'
      | 'education'
      | 'links'
      | 'project_candidate';
    action: 'add' | 'update';
    value: unknown;
    evidence: string;
  }[];
}

export interface VisibilitySettings {
  public_skills: boolean;
  public_levels: boolean;
  public_scores: boolean;
  public_name: boolean;
  public_university: boolean;
  discovery_opt_in: boolean;
}

export interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  credential_id: string;
  headline: string;
  bio: string;
  location: string;
  languages: string[];
  links: {
    website?: string;
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  target_skills: string[];
  target_roles: string[];
  visibility: VisibilitySettings;
}

export interface Affiliation {
  id: string;
  student_id: string;
  university_id?: string | null;
  university_name: string;
  program_level?: 'ug' | 'pg';
  year?: number;
  status: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
  is_verified: boolean;
  verification_type: 'roster' | 'student_id' | 'unverified';
  started_at?: string;
  ended_at?: string;
  is_current: boolean;
}

export interface AffiliationProposal {
  id: string;
  student_id: string;
  university_id: string;
  university_name: string;
  program_level?: 'ug' | 'pg';
  year: number;
  status: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
  is_verified: boolean;
  created_at: string;
}

export interface UniversityPublic {
  id: string;
  name: string;
  slug?: string;
  email_domains?: string[];
  short_name?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface SkillItem {
  id: string;
  name: string;
  slug: string;
  family: string;
  description?: string;
}

export interface SkillEdge {
  source: string;
  target: string;
}

export interface ProjectAssignment {
  id: string;
  student_id: string;
  brief: ProjectBrief;
  status: 'assigned' | 'in_progress' | 'submitted' | 'completed';
  target_skill?: string;
  created_at: string;
}

export interface SubmissionDocument {
  id: string;
  name: string;
  size: number;
  url: string;
  ext: string;
}

export interface Submission {
  id: string;
  student_id: string;
  assignment_id?: string | null;
  title: string;
  description: string;
  skills_claimed: string[];
  video_url?: string | null;
  video_duration_seconds?: number;
  video_size_bytes?: number;
  video_source: 'upload' | 'link' | 'none';
  documents: SubmissionDocument[];
  live_url?: string | null;
  github_url?: string | null;
  originality_responses: {
    question: string;
    answer: string;
    answered_in_video?: boolean;
  }[];
  ai_used: boolean;
  ai_tools: string[];
  ai_notes: string;
  status:
    | 'draft'
    | 'submitted'
    | 'auditing'
    | 'scored'
    | 'needs_review'
    | 'appealed'
    | 'failed';
  created_at: string;
  updated_at: string;
}

export type AgentRunStage =
  | 'received'
  | 'reading'
  | 'watching'
  | 'scoring'
  | 'writing'
  | 'done';

export interface AgentRun {
  id: string;
  submission_id: string;
  stage: AgentRunStage;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  updated_at: string;
  error?: string;
}

export interface SkillScore {
  id: string;
  student_id: string;
  skill_id: string;
  skill_name: string;
  skill_slug: string;
  family: string;
  score: number;
  level: SkillLevel;
  is_verified: boolean;
  is_borderline: boolean;
  last_reviewed_at: string;
  audit_id: string;
}

export interface SkillScoreHistory {
  id: string;
  student_id: string;
  skill_id: string;
  score: number;
  audit_id: string;
  created_at: string;
}

export interface AccessRequest {
  id: string;
  organization_name: string;
  organization_verified: boolean;
  job_title: string;
  message: string;
  requested_scopes: Scope[];
  duration_days: number;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
  granted_scopes?: Scope[];
  expires_at?: string;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  organization_name: string;
  job_title: string;
  category: string;
  label: string;
  note?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  student_id: string;
  kind:
    | 'audit_ready'
    | 'review_needed'
    | 'review_decided'
    | 'appeal_update'
    | 'access_request'
    | 'access_expiring'
    | 'affiliation_proposal'
    | 'feedback_received'
    | 'source_proposals';
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  link: string;
}

export interface Ticket {
  id: string;
  student_id: string;
  submission_id: string;
  skill_name: string;
  reason: string;
  status: 'received' | 'acknowledged' | 'under_review' | 'decision';
  decision?: 'upheld' | 'adjusted' | 'rejected';
  decision_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileSource {
  id: string;
  source: 'github' | 'linkedin' | 'manual';
  name: string;
  connected: boolean;
  consent_granted: boolean;
  auto_approve_proposals: boolean;
  last_synced_at?: string;
}

export interface PublicCredential {
  credential_id: string;
  issued_at: string;
  last_updated: string;
  display_name?: string;
  affiliation?: { label: string; verification: 'roster' | 'student_id' | 'unverified' };
  skills: {
    name: string;
    level: string;
    verified: true;
    score?: number;
    verified_on?: string;
  }[];
  shared_fields: string[];
}

export interface PublicConfig {
  pass_mark: number;
  borderline_low: number;
  borderline_high: number;
  require_video: boolean;
  video_max_mb: number;
  video_max_seconds: number;
  ai_kill_switch: boolean;
  ai_daily_cap_per_user: number;
}
