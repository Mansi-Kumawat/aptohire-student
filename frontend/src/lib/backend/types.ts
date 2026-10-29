import {
  AccessRequest,
  Affiliation,
  AffiliationProposal,
  AgentRun,
  Audit,
  FeedbackItem,
  NotificationItem,
  ProfileProposal,
  ProfileSource,
  ProjectAssignment,
  ProjectBrief,
  PublicConfig,
  PublicCredential,
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
} from '../domain/types';
import {
  LoginInput,
  RegisterStudentInput,
  RespondAccessInput,
  SignupInput,
  TicketFormInput,
} from '../schemas';

export interface AuthUser {
  id: string;
  email: string;
  role: 'student' | 'university' | 'organization' | 'admin' | 'other';
  full_name?: string;
}

export type RegisterOutcome =
  | 'verified_roster'
  | 'needs_student_id'
  | 'verified_student_id'
  | 'unverified'
  | 'confirm_existing'
  | 'roster_no_match';

export interface RegisterResult {
  student_id: string;
  outcome: RegisterOutcome;
  affiliation?: Affiliation;
  matched_existing_person: boolean;
}

export interface Backend {
  auth: {
    getCurrentUser(): Promise<AuthUser | null>;
    signIn(input: LoginInput): Promise<AuthUser>;
    signUp(input: SignupInput): Promise<{ user: AuthUser; requiresEmailVerification: boolean }>;
    signOut(options?: { scope?: 'local' | 'global' }): Promise<void>;
    updateEmail(newEmail: string): Promise<void>;
    updatePassword(newPassword: string): Promise<void>;
    completeSignup(): Promise<void>;
    registerStudent(input: RegisterStudentInput): Promise<RegisterResult>;
    onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
  };
  student: {
    getPublicCredential(credentialId: string): Promise<PublicCredential | null>;
    getProfile(studentId: string): Promise<StudentProfile>;
    updateProfile(studentId: string, updates: Partial<StudentProfile>): Promise<StudentProfile>;
    uploadAvatar(studentId: string, blob: Blob): Promise<{ avatar_url: string }>;
    removeAvatar(studentId: string): Promise<void>;
    getVisibility(studentId: string): Promise<VisibilitySettings>;
    updateVisibility(studentId: string, settings: VisibilitySettings): Promise<VisibilitySettings>;
  };
  affiliations: {
    listAffiliations(studentId: string): Promise<Affiliation[]>;
    listProposals(studentId: string): Promise<AffiliationProposal[]>;
    confirmAffiliation(params: {
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
    }): Promise<Affiliation>;
    updateAffiliation(
      studentId: string,
      affiliationId: string,
      updates: Partial<Affiliation>
    ): Promise<Affiliation>;
    listUniversities(): Promise<UniversityPublic[]>;
  };
  skills: {
    listSkills(): Promise<SkillItem[]>;
    listSkillEdges(): Promise<SkillEdge[]>;
  };
  projects: {
    listAssignments(studentId: string): Promise<ProjectAssignment[]>;
    getAssignment(assignmentId: string): Promise<ProjectAssignment | null>;
    assignProject(params: {
      student_id: string;
      target: { skill_slug?: string; role_text?: string };
      level?: 'Competent' | 'Proficient' | 'Advanced';
    }): Promise<{ assignment_id: string; brief: ProjectBrief }>;
    updateAssignmentStatus(
      assignmentId: string,
      status: 'in_progress'
    ): Promise<ProjectAssignment>;
  };
  submissions: {
    listSubmissions(studentId: string): Promise<Submission[]>;
    getSubmission(submissionId: string): Promise<Submission | null>;
    saveDraft(draft: Partial<Submission> & { student_id: string }): Promise<Submission>;
    submitProject(params: {
      submission_id: string;
      confirm: boolean;
    }): Promise<{ run_id: string; status: string; mode: string }>;
    retrySubmission(submissionId: string): Promise<{ run_id: string; status: string }>;
  };
  uploads: {
    uploadVideoTus(
      file: File,
      submissionId: string,
      onProgress?: (percent: number) => void
    ): Promise<{ url: string; duration: number; size: number }>;
    uploadDocument(file: File, submissionId: string): Promise<SubmissionDocument>;
    getSignedPlaybackUrl(submissionId: string, path: string): Promise<string>;
    getSignedDocumentUrl(submissionId: string, path: string): Promise<string>;
  };
  audits: {
    getAudit(submissionId: string): Promise<Audit | null>;
    getAgentRun(submissionId: string): Promise<AgentRun | null>;
    subscribeAgentRun(
      submissionId: string,
      onUpdate: (run: AgentRun) => void
    ): () => void;
  };
  scores: {
    listSkillScores(studentId: string): Promise<SkillScore[]>;
    getSkillScore(studentId: string, skillSlug: string): Promise<SkillScore | null>;
    listScoreHistory(studentId: string, skillId?: string): Promise<SkillScoreHistory[]>;
  };
  tickets: {
    listTickets(studentId: string): Promise<Ticket[]>;
    createTicket(input: TicketFormInput & { student_id: string }): Promise<Ticket>;
  };
  sources: {
    listSources(studentId: string): Promise<ProfileSource[]>;
    updateSourceConsent(
      studentId: string,
      sourceId: string,
      consent: boolean,
      autoApprove?: boolean
    ): Promise<ProfileSource>;
    syncSource(
      studentId: string,
      source: 'github' | 'linkedin' | 'manual',
      payload?: unknown
    ): Promise<{ proposals?: ProfileProposal[]; last_synced_at: string }>;
    disconnectSource(
      studentId: string,
      sourceId: string,
      deleteDerivedData?: boolean
    ): Promise<void>;
    listProposals(studentId: string): Promise<ProfileProposal[]>;
    applyProposal(studentId: string, proposalIndex: number): Promise<void>;
    dismissProposal(studentId: string, proposalIndex: number): Promise<void>;
  };
  sharing: {
    listAccessRequests(studentId: string): Promise<AccessRequest[]>;
    respondAccess(input: RespondAccessInput): Promise<{ status: string; expires_at?: string }>;
    withdrawAccess(requestId: string): Promise<{ status: 'withdrawn' }>;
    listFeedback(studentId: string): Promise<FeedbackItem[]>;
    subscribeAccessRequests(
      studentId: string,
      onRequestChange: (request: AccessRequest) => void
    ): () => void;
  };
  notifications: {
    listNotifications(studentId: string): Promise<NotificationItem[]>;
    markNotificationRead(notificationId: string): Promise<void>;
    markAllNotificationsRead(studentId: string): Promise<void>;
    subscribeNotifications(
      studentId: string,
      onNotification: (item: NotificationItem) => void
    ): () => void;
  };
  config: {
    getPublicConfig(): Promise<PublicConfig>;
  };
  account: {
    exportMyData(studentId: string): Promise<{ signed_url: string }>;
    deleteMyAccount(studentId: string, confirm: string, password?: string): Promise<void>;
    resetDemoData(): Promise<void>;
  };
}
