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
  Scope,
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
import { getSupabase } from '../../supabase/client';
import { AuthUser, Backend, RegisterResult } from '../types';
import * as tus from 'tus-js-client';
import { env } from '@/config/env';

export class SupabaseBackend implements Backend {
  private client = getSupabase();

  private async callEdgeFunction<TReq, TRes>(name: string, payload?: TReq): Promise<TRes> {
    const { data: { session } } = await this.client.auth.getSession();
    const token = session?.access_token;
    const baseUrl = env.VITE_SUPABASE_URL
      ? `${env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1`
      : '/functions/v1';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(env.VITE_SUPABASE_ANON_KEY ? { apikey: env.VITE_SUPABASE_ANON_KEY } : {}),
    };

    const res = await fetch(`${baseUrl}/${name}`, {
      method: 'POST',
      headers,
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!res.ok) {
      let errBody;
      try {
        errBody = await res.json();
      } catch {
        // ignore
      }
      const err = new Error(errBody?.error?.message || `Edge function ${name} failed`);
      Object.assign(err, {
        code: errBody?.error?.code || 'UNKNOWN_ERROR',
        fields: errBody?.error?.fields,
      });
      throw err;
    }

    if (res.status === 204) {
      return {} as TRes;
    }

    return res.json();
  }

  // ---------------- AUTH ----------------
  auth = {
    getCurrentUser: async (): Promise<AuthUser | null> => {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error || !user) return null;

      // Query profiles table for role
      const { data: profile } = await this.client
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        role: profile?.role || 'student',
        full_name: profile?.full_name || user.user_metadata?.full_name,
      };
    },
    signIn: async (input: LoginInput): Promise<AuthUser> => {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed: no user returned');

      const { data: profile } = await this.client
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      return {
        id: data.user.id,
        email: data.user.email || '',
        role: profile?.role || 'student',
        full_name: profile?.full_name || data.user.user_metadata?.full_name,
      };
    },
    signUp: async (
      input: SignupInput
    ): Promise<{ user: AuthUser; requiresEmailVerification: boolean }> => {
      const { data, error } = await this.client.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { full_name: input.full_name },
          emailRedirectTo: `${env.VITE_SITE_URL}/auth/callback`,
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed');

      const requiresVerification = !data.session;
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || input.email,
        role: 'student',
        full_name: input.full_name,
      };
      return { user, requiresEmailVerification: requiresVerification };
    },
    signOut: async (options?: { scope?: 'local' | 'global' }): Promise<void> => {
      const { error } = await this.client.auth.signOut({
        scope: options?.scope === 'global' ? 'global' : 'local',
      });
      if (error) throw error;
    },
    updateEmail: async (newEmail: string): Promise<void> => {
      const { error } = await this.client.auth.updateUser({ email: newEmail });
      if (error) throw error;
    },
    updatePassword: async (newPassword: string): Promise<void> => {
      const { error } = await this.client.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    completeSignup: async (): Promise<void> => {
      await this.callEdgeFunction('complete-signup', { portal: 'student' });
    },
    registerStudent: async (input: RegisterStudentInput): Promise<RegisterResult> => {
      return this.callEdgeFunction('register-student', input);
    },
    onAuthStateChange: (callback: (user: AuthUser | null) => void) => {
      const { data: { subscription } } = this.client.auth.onAuthStateChange(
        async (_event, session) => {
          if (!session?.user) {
            callback(null);
            return;
          }
          const { data: profile } = await this.client
            .from('profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .single();

          callback({
            id: session.user.id,
            email: session.user.email || '',
            role: profile?.role || 'student',
            full_name: profile?.full_name,
          });
        }
      );
      return () => subscription.unsubscribe();
    },
  };

  // ---------------- STUDENT ----------------
  student = {
    getProfile: async (studentId: string): Promise<StudentProfile> => {
      const { data, error } = await this.client
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      if (error) throw error;
      return {
        id: data.id,
        full_name: data.full_name || '',
        email: data.email || '',
        avatar_url: data.avatar_url,
        credential_id: data.credential_id || '',
        headline: data.headline || '',
        bio: data.bio || '',
        location: data.location || '',
        languages: data.languages || ['English'],
        links: data.links || {},
        target_skills: data.target_skills || [],
        target_roles: data.target_roles || [],
        visibility: data.visibility || {
          public_skills: true,
          public_levels: true,
          public_scores: true,
          public_name: true,
          public_university: false,
          discovery_opt_in: true,
        },
      };
    },
    updateProfile: async (
      studentId: string,
      updates: Partial<StudentProfile>
    ): Promise<StudentProfile> => {
      const { data, error } = await this.client
        .from('students')
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    uploadAvatar: async (
      studentId: string,
      blob: Blob
    ): Promise<{ avatar_url: string }> => {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) throw new Error('Authentication required');
      const objectPath = `${user.id}/avatar.jpg`;
      const { error } = await this.client.storage
        .from('avatars')
        .upload(objectPath, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw error;
      // Private bucket access via signed URL
      const { data: signedData, error: signError } = await this.client.storage
        .from('avatars')
        .createSignedUrl(objectPath, 60 * 60 * 24 * 7); // 7-day signed URL
      if (signError) throw signError;
      await this.student.updateProfile(studentId, { avatar_url: signedData.signedUrl });
      return { avatar_url: signedData.signedUrl };
    },
    removeAvatar: async (studentId: string): Promise<void> => {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) throw new Error('Authentication required');
      const objectPath = `${user.id}/avatar.jpg`;
      await this.client.storage.from('avatars').remove([objectPath]);
      await this.student.updateProfile(studentId, { avatar_url: null });
    },
    getVisibility: async (studentId: string): Promise<VisibilitySettings> => {
      const profile = await this.student.getProfile(studentId);
      return profile.visibility;
    },
    updateVisibility: async (
      studentId: string,
      settings: VisibilitySettings
    ): Promise<VisibilitySettings> => {
      const { error } = await this.client
        .from('students')
        .update({ visibility: settings })
        .eq('id', studentId);
      if (error) throw error;
      return settings;
    },
  };

  // ---------------- AFFILIATIONS ----------------
  affiliations = {
    listAffiliations: async (studentId: string): Promise<Affiliation[]> => {
      const { data, error } = await this.client
        .from('affiliations')
        .select('*')
        .eq('student_id', studentId)
        .order('is_current', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    listProposals: async (_studentId: string): Promise<AffiliationProposal[]> => {
      // Reads from my_affiliation_proposals view
      const { data, error } = await this.client
        .from('my_affiliation_proposals')
        .select('*');
      if (error) {
        // Fallback gracefully if view is not yet added in backend
        return [];
      }
      return data || [];
    },
    confirmAffiliation: async (params: {
      student_id: string;
      proposal_id?: string;
      new?: {
        university_id?: string;
        university_name?: string;
        program_level?: 'ug' | 'pg';
        year?: number;
        status?: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
      };
    }): Promise<Affiliation> => {
      return this.callEdgeFunction('confirm-affiliation', params);
    },
    updateAffiliation: async (
      _studentId: string,
      affiliationId: string,
      updates: Partial<Affiliation>
    ): Promise<Affiliation> => {
      const { data, error } = await this.client
        .from('affiliations')
        .update(updates)
        .eq('id', affiliationId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    listUniversities: async (): Promise<UniversityPublic[]> => {
      const { data, error } = await this.client
        .from('universities')
        .select('id, name, slug, email_domains');
      if (error) throw error;
      return data || [];
    },
  };

  // ---------------- SKILLS ----------------
  skills = {
    listSkills: async (): Promise<SkillItem[]> => {
      const { data, error } = await this.client
        .from('skills')
        .select('id, name, slug, family, description');
      if (error) throw error;
      return data || [];
    },
    listSkillEdges: async (): Promise<SkillEdge[]> => {
      const { data, error } = await this.client
        .from('skill_edges')
        .select('source, target');
      if (error) throw error;
      return data || [];
    },
  };

  // ---------------- PROJECTS ----------------
  projects = {
    listAssignments: async (studentId: string): Promise<ProjectAssignment[]> => {
      const { data, error } = await this.client
        .from('project_assignments')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    getAssignment: async (assignmentId: string): Promise<ProjectAssignment | null> => {
      const { data, error } = await this.client
        .from('project_assignments')
        .select('*')
        .eq('id', assignmentId)
        .single();
      if (error) return null;
      return data;
    },
    assignProject: async (params: {
      student_id: string;
      target: { skill_slug?: string; role_text?: string };
      level?: 'Competent' | 'Proficient' | 'Advanced';
    }): Promise<{ assignment_id: string; brief: ProjectBrief }> => {
      return this.callEdgeFunction('assign-project', params);
    },
    updateAssignmentStatus: async (
      assignmentId: string,
      status: 'assigned' | 'in_progress' | 'submitted' | 'completed'
    ): Promise<ProjectAssignment> => {
      const { data, error } = await this.client
        .from('project_assignments')
        .update({ status })
        .eq('id', assignmentId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  };

  // ---------------- SUBMISSIONS ----------------
  submissions = {
    listSubmissions: async (studentId: string): Promise<Submission[]> => {
      const { data, error } = await this.client
        .from('submissions')
        .select('*')
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    getSubmission: async (submissionId: string): Promise<Submission | null> => {
      const { data, error } = await this.client
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
      if (error) return null;
      return data;
    },
    saveDraft: async (
      draft: Partial<Submission> & { student_id: string }
    ): Promise<Submission> => {
      if (draft.id) {
        const { data, error } = await this.client
          .from('submissions')
          .update(draft)
          .eq('id', draft.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await this.client
          .from('submissions')
          .insert(draft)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    submitProject: async (params: {
      submission_id: string;
      confirm: boolean;
    }): Promise<{ run_id: string; status: string; mode: string }> => {
      return this.callEdgeFunction('submit-project', params);
    },
    retrySubmission: async (
      submissionId: string
    ): Promise<{ run_id: string; status: string }> => {
      return this.callEdgeFunction('submit-project', {
        submission_id: submissionId,
        confirm: true,
      });
    },
  };

  // ---------------- UPLOADS ----------------
  uploads = {
    uploadVideoTus: async (
      file: File,
      submissionId: string,
      onProgress?: (percent: number) => void
    ): Promise<{ url: string; duration: number; size: number }> => {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) throw new Error('Authentication required for video upload');
      const { data: { session } } = await this.client.auth.getSession();
      const ext = file.name.split('.').pop() || 'mp4';
      const endpoint = `${env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`;

      return new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session?.access_token}`,
            'x-upsert': 'true',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: 'videos',
            objectName: `${user.id}/${submissionId}/demo.${ext}`,
            contentType: file.type,
          },
          chunkSize: 6 * 1024 * 1024,
          onError: (error) => reject(error),
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
            if (onProgress) onProgress(percentage);
          },
          onSuccess: () => {
            const path = `${user.id}/${submissionId}/demo.${ext}`;
            resolve({ url: path, duration: 0, size: file.size });
          },
        });
        upload.start();
      });
    },
    uploadDocument: async (
      file: File,
      submissionId: string
    ): Promise<SubmissionDocument> => {
      const { data: { user } } = await this.client.auth.getUser();
      if (!user) throw new Error('Authentication required');
      const ext = file.name.split('.').pop() || 'pdf';
      const path = `${user.id}/${submissionId}/${file.name}`;

      const { error } = await this.client.storage
        .from('documents')
        .upload(path, file, { upsert: true });
      if (error) throw error;

      return {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        url: path,
        ext,
      };
    },
    getSignedPlaybackUrl: async (
      _submissionId: string,
      path: string
    ): Promise<string> => {
      const { data, error } = await this.client.storage
        .from('videos')
        .createSignedUrl(path, 600); // 10 minutes signed URL
      if (error) throw error;
      return data.signedUrl;
    },
    getSignedDocumentUrl: async (
      _submissionId: string,
      path: string
    ): Promise<string> => {
      const { data, error } = await this.client.storage
        .from('documents')
        .createSignedUrl(path, 600); // 10 minutes signed URL
      if (error) throw error;
      return data.signedUrl;
    },
  };

  // ---------------- AUDITS ----------------
  audits = {
    getAudit: async (submissionId: string): Promise<Audit | null> => {
      const { data, error } = await this.client
        .from('audits')
        .select('*')
        .eq('submission_id', submissionId)
        .single();
      if (error) return null;
      return data;
    },
    getAgentRun: async (submissionId: string): Promise<AgentRun | null> => {
      const { data, error } = await this.client
        .from('agent_runs')
        .select('*')
        .eq('submission_id', submissionId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
      if (error) return null;
      return data;
    },
    subscribeAgentRun: (
      submissionId: string,
      onUpdate: (run: AgentRun) => void
    ): () => void => {
      const channel = this.client
        .channel(`agent_run_${submissionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agent_runs',
            filter: `submission_id=eq.${submissionId}`,
          },
          (payload) => {
            onUpdate(payload.new as AgentRun);
          }
        )
        .subscribe();

      return () => {
        this.client.removeChannel(channel);
      };
    },
  };

  // ---------------- SCORES ----------------
  scores = {
    listSkillScores: async (studentId: string): Promise<SkillScore[]> => {
      const { data, error } = await this.client
        .from('skill_scores')
        .select('*')
        .eq('student_id', studentId);
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => {
        const score = typeof row.score === 'number' ? row.score : 0;
        return {
          ...(row as unknown as SkillScore),
          level: levelFor(score),
          is_verified: isVerified(score),
          is_borderline: isBorderline(score),
        };
      });
    },
    getSkillScore: async (
      studentId: string,
      skillSlug: string
    ): Promise<SkillScore | null> => {
      const { data, error } = await this.client
        .from('skill_scores')
        .select('*')
        .eq('student_id', studentId)
        .eq('skill_slug', skillSlug)
        .single();
      if (error) return null;
      return {
        ...data,
        level: levelFor(data.score),
        is_verified: isVerified(data.score),
        is_borderline: isBorderline(data.score),
      };
    },
    listScoreHistory: async (
      studentId: string,
      skillId?: string
    ): Promise<SkillScoreHistory[]> => {
      let query = this.client
        .from('skill_score_history')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

      if (skillId) {
        query = query.eq('skill_id', skillId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  };

  // ---------------- TICKETS ----------------
  tickets = {
    listTickets: async (studentId: string): Promise<Ticket[]> => {
      const { data, error } = await this.client
        .from('tickets')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    createTicket: async (
      input: TicketFormInput & { student_id: string }
    ): Promise<Ticket> => {
      const { data, error } = await this.client
        .from('tickets')
        .insert({
          student_id: input.student_id,
          submission_id: input.submission_id,
          skill_name: input.skill_name,
          reason: input.reason,
          status: 'received',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  };

  // ---------------- SOURCES ----------------
  sources = {
    listSources: async (studentId: string): Promise<ProfileSource[]> => {
      const { data, error } = await this.client
        .from('profile_sources')
        .select('*')
        .eq('student_id', studentId);
      if (error) return [];
      return data || [];
    },
    updateSourceConsent: async (
      _studentId: string,
      sourceId: string,
      consent: boolean,
      autoApprove?: boolean
    ): Promise<ProfileSource> => {
      const { data, error } = await this.client
        .from('profile_sources')
        .update({
          consent_granted: consent,
          ...(autoApprove !== undefined ? { auto_approve_proposals: autoApprove } : {}),
        })
        .eq('id', sourceId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    syncSource: async (
      _studentId: string,
      source: 'github' | 'linkedin' | 'manual',
      payload?: unknown
    ): Promise<{ proposals?: ProfileProposal[]; last_synced_at: string }> => {
      return this.callEdgeFunction('profile-sync', { action: `${source}_sync`, payload });
    },
    disconnectSource: async (
      _studentId: string,
      sourceId: string,
      deleteDerivedData?: boolean
    ): Promise<void> => {
      await this.callEdgeFunction('profile-sync', {
        action: 'revoke',
        source_id: sourceId,
        delete_data: deleteDerivedData,
      });
    },
    listProposals: async (_studentId: string): Promise<ProfileProposal[]> => {
      // TODO(backend): profile_proposals storage for synced changes
      return [];
    },
    applyProposal: async (_studentId: string, _proposalIndex: number): Promise<void> => {
      // TODO(backend): apply proposal endpoint
    },
    dismissProposal: async (_studentId: string, _proposalIndex: number): Promise<void> => {
      // TODO(backend): dismiss proposal endpoint
    },
  };

  // ---------------- SHARING ----------------
  sharing = {
    listAccessRequests: async (studentId: string): Promise<AccessRequest[]> => {
      const { data, error } = await this.client
        .from('access_requests')
        .select(
          `id, status, requested_scopes, granted_scopes, duration_days, expires_at, created_at,
           organizations (name, is_verified),
           jobs (title)`
        )
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => {
        const org = row.organizations as { name?: string; is_verified?: boolean } | undefined;
        const job = row.jobs as { title?: string } | undefined;
        return {
          id: String(row.id),
          organization_name: org?.name || 'Organization',
          organization_verified: !!org?.is_verified,
          job_title: job?.title || 'Job Opportunity',
          message: typeof row.message === 'string' ? row.message : '',
          requested_scopes: (row.requested_scopes as Scope[]) || [],
          duration_days: typeof row.duration_days === 'number' ? row.duration_days : 30,
          status: (row.status as 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired') || 'pending',
          granted_scopes: row.granted_scopes as Scope[] | undefined,
          expires_at: typeof row.expires_at === 'string' ? row.expires_at : undefined,
          created_at: typeof row.created_at === 'string' ? row.created_at : '',
        };
      });
    },
    respondAccess: async (
      input: RespondAccessInput
    ): Promise<{ status: string; expires_at?: string }> => {
      return this.callEdgeFunction('respond-access', input);
    },
    withdrawAccess: async (requestId: string): Promise<{ status: 'withdrawn' }> => {
      return this.callEdgeFunction('withdraw-access', { request_id: requestId });
    },
    listFeedback: async (studentId: string): Promise<FeedbackItem[]> => {
      const { data, error } = await this.client
        .from('feedback')
        .select('id, organization_name, job_title, category, label, note, created_at')
        .eq('student_id', studentId);
      if (error) return [];
      return data || [];
    },
    subscribeAccessRequests: (
      studentId: string,
      onRequestChange: (request: AccessRequest) => void
    ): () => void => {
      const channel = this.client
        .channel(`access_requests_${studentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'access_requests',
            filter: `student_id=eq.${studentId}`,
          },
          (payload) => {
            onRequestChange(payload.new as AccessRequest);
          }
        )
        .subscribe();
      return () => {
        this.client.removeChannel(channel);
      };
    },
  };

  // ---------------- NOTIFICATIONS ----------------
  notifications = {
    listNotifications: async (studentId: string): Promise<NotificationItem[]> => {
      const { data, error } = await this.client
        .from('notifications')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    markNotificationRead: async (notificationId: string): Promise<void> => {
      const { error } = await this.client
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    markAllNotificationsRead: async (studentId: string): Promise<void> => {
      const { error } = await this.client
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('student_id', studentId)
        .is('read_at', null);
      if (error) throw error;
    },
    subscribeNotifications: (
      studentId: string,
      onNotification: (item: NotificationItem) => void
    ): () => void => {
      const channel = this.client
        .channel(`notifications_${studentId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `student_id=eq.${studentId}`,
          },
          (payload) => {
            onNotification(payload.new as NotificationItem);
          }
        )
        .subscribe();
      return () => {
        this.client.removeChannel(channel);
      };
    },
  };

  // ---------------- CONFIG ----------------
  config = {
    getPublicConfig: async (): Promise<PublicConfig> => {
      const { data, error } = await this.client
        .from('public_config')
        .select('*')
        .single();
      if (error || !data) {
        return {
          pass_mark: 50,
          borderline_low: 40,
          borderline_high: 60,
          require_video: true,
          video_max_mb: env.VITE_VIDEO_MAX_MB,
          video_max_seconds: env.VITE_VIDEO_MAX_SECONDS,
          ai_kill_switch: false,
          ai_daily_cap_per_user: 5,
        };
      }
      return data;
    },
  };

  // ---------------- ACCOUNT ----------------
  account = {
    exportMyData: async (_studentId: string): Promise<{ signed_url: string }> => {
      return this.callEdgeFunction('export-my-data', {});
    },
    deleteMyAccount: async (
      _studentId: string,
      confirm: string,
      password?: string
    ): Promise<void> => {
      await this.callEdgeFunction('delete-my-account', { confirm, password });
    },
    resetDemoData: async (): Promise<void> => {
      // No-op in real backend
    },
  };
}
