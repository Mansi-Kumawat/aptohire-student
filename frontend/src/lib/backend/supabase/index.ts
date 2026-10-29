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


function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function mapVisibility(value: unknown): VisibilitySettings {
  const stored = asRecord(value);
  const shared = Array.isArray(stored.public_verify)
    ? stored.public_verify.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    public_skills: shared.includes('skills'),
    public_levels: shared.includes('levels'),
    public_scores: shared.includes('scores'),
    public_name: shared.includes('name'),
    public_university: shared.includes('university'),
    discovery_opt_in: stored.discoverable === true,
  };
}

function mapLinks(value: unknown): StudentProfile['links'] {
  const links = asRecord(value);
  return {
    ...(typeof links.website === 'string' ? { website: links.website } : {}),
    ...(typeof links.github === 'string' ? { github: links.github } : {}),
    ...(typeof links.linkedin === 'string' ? { linkedin: links.linkedin } : {}),
    ...(typeof links.portfolio === 'string' ? { portfolio: links.portfolio } : {}),
  };
}

function mapNotification(row: Record<string, unknown>, studentId: string): NotificationItem {
  const payload = asRecord(row.payload);
  const rawKind = typeof row.kind === 'string' ? row.kind : 'notification';
  const rawTitle = payload.title;
  const rawBody = payload.body ?? payload.message;
  const rawLink = payload.link ?? payload.href;
  const link = typeof rawLink === 'string' && rawLink.startsWith('/') && !rawLink.startsWith('//')
    ? rawLink
    : '/notifications';

  return {
    id: String(row.id ?? ''),
    student_id: studentId,
    kind: rawKind as NotificationItem['kind'],
    title: typeof rawTitle === 'string' ? rawTitle : rawKind.replace(/_/g, ' '),
    body: typeof rawBody === 'string' ? rawBody : '',
    read_at: typeof row.read_at === 'string' ? row.read_at : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : '',
    link,
  };
}

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

  private async getCurrentStudentRow() {
    const { data: { user }, error: userError } = await this.client.auth.getUser();
    if (userError || !user) throw new Error('Authentication required');

    const { data, error } = await this.client
      .from('students')
      .select('id,user_id,full_name,primary_email,credential_id,photo_path,headline,bio,location,languages,links,target_skill_ids,target_roles,visibility')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('Student profile not found. Complete registration first.');
    return data;
  }

  // ---------------- AUTH ----------------
  auth = {
    getCurrentUser: async (): Promise<AuthUser | null> => {
      const { data: { user }, error } = await this.client.auth.getUser();
      if (error || !user) return null;

      // Query profiles table for role
      const { data: profile } = await this.client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

      const metadataName = user.user_metadata?.full_name;
      return {
        id: user.id,
        email: user.email || '',
        role: profile?.role || 'student',
        full_name: typeof metadataName === 'string' ? metadataName : undefined,
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
      .select('role')
      .eq('id', data.user.id)
      .single();

      const metadataName = data.user.user_metadata?.full_name;
      return {
        id: data.user.id,
        email: data.user.email || '',
        role: profile?.role || 'student',
        full_name: typeof metadataName === 'string' ? metadataName : undefined,
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
          .select('role')
          .eq('id', session.user.id)
          .single();

          const metadataName = session.user.user_metadata?.full_name;
          callback({
            id: session.user.id,
            email: session.user.email || '',
            role: profile?.role || 'student',
            full_name: typeof metadataName === 'string' ? metadataName : undefined,
          });
        }
      );
      return () => subscription.unsubscribe();
    },
  };

  // ---------------- STUDENT ----------------
  
  student = {
    getProfile: async (_studentId: string): Promise<StudentProfile> => {
      const data = await this.getCurrentStudentRow();
      const targetSkillIds = Array.isArray(data.target_skill_ids)
        ? data.target_skill_ids.filter((id): id is string => typeof id === 'string')
        : [];

      let targetSkills: string[] = [];
      if (targetSkillIds.length > 0) {
        const { data: skills, error: skillsError } = await this.client
          .from('skills')
          .select('id,name')
          .in('id', targetSkillIds);
        if (skillsError) throw skillsError;
        targetSkills = (skills ?? []).map((skill) => String(skill.name));
      }

      let avatarUrl: string | null = null;
      if (typeof data.photo_path === 'string' && data.photo_path.length > 0) {
        const { data: signed, error: signedError } = await this.client.storage
          .from('avatars')
          .createSignedUrl(data.photo_path, 600);
        if (signedError) throw signedError;
        avatarUrl = signed.signedUrl;
      }

      return {
        id: String(data.id),
        full_name: String(data.full_name ?? ''),
        email: String(data.primary_email ?? ''),
        avatar_url: avatarUrl,
        credential_id: String(data.credential_id ?? ''),
        headline: String(data.headline ?? ''),
        bio: String(data.bio ?? ''),
        location: String(data.location ?? ''),
        languages: Array.isArray(data.languages)
          ? data.languages.filter((item): item is string => typeof item === 'string')
          : [],
        links: mapLinks(data.links),
        target_skills: targetSkills,
        target_roles: Array.isArray(data.target_roles)
          ? data.target_roles.filter((item): item is string => typeof item === 'string')
          : [],
        visibility: mapVisibility(data.visibility),
      };
    },

    updateProfile: async (
      _studentId: string,
      updates: Partial<StudentProfile>
    ): Promise<StudentProfile> => {
      const current = await this.getCurrentStudentRow();
      const dbUpdates: Record<string, unknown> = {};

      if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
      if (updates.headline !== undefined) dbUpdates.headline = updates.headline;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.languages !== undefined) dbUpdates.languages = updates.languages;
      if (updates.links !== undefined) dbUpdates.links = updates.links;
      if (updates.target_roles !== undefined) dbUpdates.target_roles = updates.target_roles;

      if (updates.target_skills !== undefined) {
        if (updates.target_skills.length === 0) {
          dbUpdates.target_skill_ids = [];
        } else {
          const { data: skills, error: skillsError } = await this.client
            .from('skills')
            .select('id,name')
            .in('name', updates.target_skills);
          if (skillsError) throw skillsError;
          const byName = new Map((skills ?? []).map((skill) => [String(skill.name), String(skill.id)]));
          const missing = updates.target_skills.filter((name) => !byName.has(name));
          if (missing.length > 0) throw new Error('One or more selected skills are not in the catalog.');
          dbUpdates.target_skill_ids = updates.target_skills.map((name) => byName.get(name));
        }
      }

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await this.client
          .from('students')
          .update(dbUpdates)
          .eq('id', current.id);
        if (error) throw error;
      }

      return this.student.getProfile(String(current.id));
    },

    uploadAvatar: async (
      _studentId: string,
      blob: Blob
    ): Promise<{ avatar_url: string }> => {
      const current = await this.getCurrentStudentRow();
      // Backend Storage policy requires the object name to be exactly <student_id>.jpg.
      const objectPath = `${current.id}.jpg`;
      const { error: uploadError } = await this.client.storage
        .from('avatars')
        .upload(objectPath, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { error: updateError } = await this.client
        .from('students')
        .update({ photo_path: objectPath })
        .eq('id', current.id);
      if (updateError) throw updateError;

      const { data: signed, error: signedError } = await this.client.storage
        .from('avatars')
        .createSignedUrl(objectPath, 600);
      if (signedError) throw signedError;
      return { avatar_url: signed.signedUrl };
    },

    removeAvatar: async (_studentId: string): Promise<void> => {
      const current = await this.getCurrentStudentRow();
      const objectPath = `${current.id}.jpg`;
      const { error: removeError } = await this.client.storage
        .from('avatars')
        .remove([objectPath]);
      if (removeError) throw removeError;

      const { error: updateError } = await this.client
        .from('students')
        .update({ photo_path: null })
        .eq('id', current.id);
      if (updateError) throw updateError;
    },

    getVisibility: async (_studentId: string): Promise<VisibilitySettings> => {
      const current = await this.getCurrentStudentRow();
      return mapVisibility(current.visibility);
    },

    updateVisibility: async (
      _studentId: string,
      settings: VisibilitySettings
    ): Promise<VisibilitySettings> => {
      const current = await this.getCurrentStudentRow();
      const previous = asRecord(current.visibility);
      const public_verify = [
        ...(settings.public_skills ? ['skills'] : []),
        ...(settings.public_levels && settings.public_skills ? ['levels'] : []),
        ...(settings.public_scores && settings.public_levels && settings.public_skills ? ['scores'] : []),
        ...(settings.public_name ? ['name'] : []),
        ...(settings.public_university ? ['university'] : []),
      ];
      const p_visibility = {
        public_verify,
        discoverable: settings.discovery_opt_in,
        university_files: previous.university_files === true,
      };
      const { error } = await this.client.rpc('update_my_visibility', { p_visibility });
      if (error) throw error;
      return mapVisibility(p_visibility);
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
        university_name_text?: string;
        student_id_number?: string;
        program_level?: 'ug' | 'pg';
        year?: number;
        status?: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
      };
    }): Promise<Affiliation> => {
      const hasProposal = Boolean(params.proposal_id);
      const hasNew = Boolean(params.new);
      if (hasProposal === hasNew) {
        throw new Error('Choose either an existing proposal or a new affiliation.');
      }

      let body: Record<string, unknown>;
      if (params.proposal_id) {
        body = { kind: 'proposal', proposal_id: params.proposal_id };
      } else {
        const next = params.new!;
        const status = next.status === 'masters' ? 'enrolled' : next.status ?? 'enrolled';
        const program_level = next.status === 'masters' ? 'pg' : next.program_level ?? 'ug';
        body = {
          kind: 'new',
          new: {
            ...(next.university_id ? { university_id: next.university_id } : {}),
            ...(next.university_name_text ? { university_name_text: next.university_name_text } : {}),
            ...(next.student_id_number ? { student_id_number: next.student_id_number } : {}),
            program_level,
            ...(next.year !== undefined ? { year: next.year } : {}),
            status,
          },
        };
      }

      const result = await this.callEdgeFunction<
        Record<string, unknown>,
        { affiliation: {
          id: string;
          university_id: string | null;
          university_name_text: string | null;
          verification: 'roster' | 'student_id' | 'unverified';
          program_level: 'ug' | 'pg' | null;
          year: number | null;
          status: 'incoming' | 'enrolled' | 'alumni' | 'dropout';
          is_current: true;
        } }
      >('confirm-affiliation', body);

      const current = await this.getCurrentStudentRow();
      const item = result.affiliation;
      return {
        id: item.id,
        student_id: String(current.id),
        university_id: item.university_id,
        university_name: item.university_name_text ?? '',
        program_level: item.program_level ?? 'ug',
        ...(item.year !== null ? { year: item.year } : {}),
        status: item.status,
        is_verified: item.verification !== 'unverified',
        verification_type: item.verification,
        is_current: item.is_current,
      };
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
      const skillSlug = params.target.skill_slug?.trim();
      const roleText = params.target.role_text?.trim();

      // Send exactly one target variant. Never send the Auth user ID as a request field;
      // the backend derives the student from the signed-in JWT.
      const target = skillSlug
        ? { skill_slug: skillSlug }
        : roleText
          ? { role_text: roleText }
          : null;

      if (!target) throw new Error('Choose a skill or role before requesting a project.');

      return this.callEdgeFunction('assign-project', {
        target,
        ...(params.level ? { level: params.level } : {}),
      });
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
    listSources: async (_studentId: string): Promise<ProfileSource[]> => {
      const { data: { user }, error: userError } = await this.client.auth.getUser();
      if (userError || !user) throw new Error('Sign in to view connected sources.');

      const { data: student, error: studentError } = await this.client
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (studentError || !student) throw new Error('Complete student registration to view sources.');

      // Never select token_secret_id; it is intentionally not exposed to the browser.
      const { data, error } = await this.client
        .from('profile_sources')
        .select('id,source_type,auto_approve,consented_at,revoked_at')
        .eq('student_id', student.id)
        .order('id');
      if (error) throw error;

      return (data ?? []).flatMap((row): ProfileSource[] => {
        const source = row.source_type === 'linkedin_export' ? 'linkedin'
          : row.source_type === 'github' ? 'github'
          : null;
        // The backend has no manual source type; omit unknown rows rather than inventing a mapping.
        if (!source) return [];
        const consentGranted = Boolean(row.consented_at) && !row.revoked_at;
        return [{
          id: row.id,
          source,
          name: source === 'linkedin' ? 'LinkedIn export' : 'GitHub',
          // The DB does not expose OAuth-token state, so consent is not presented as proof of connection.
          connected: false,
          consent_granted: consentGranted,
          auto_approve_proposals: row.auto_approve,
        }];
      });
    },
    updateSourceConsent: async (
      _studentId: string,
      _sourceId: string,
      _consent: boolean,
      _autoApprove?: boolean
    ): Promise<ProfileSource> => {
      throw new Error('Consent is recorded during source authorization. Use Disconnect to revoke it.');
    },
    syncSource: async (
      _studentId: string,
      source: 'github' | 'linkedin' | 'manual',
      payload?: unknown
    ): Promise<{ proposals?: ProfileProposal[]; last_synced_at: string }> => {
      if (source !== 'github') {
        throw new Error('Only GitHub OAuth is available in this portal flow. LinkedIn export parsing needs an uploaded export.');
      }

      const request = payload && typeof payload === 'object'
        ? payload as { source_id?: string }
        : undefined;
      if (request?.source_id) {
        return this.callEdgeFunction('profile-sync', {
          action: 'github_sync',
          source_id: request.source_id,
        });
      }

      const result = await this.callEdgeFunction<
        { action: 'github_start' },
        { authorize_url: string }
      >('profile-sync', { action: 'github_start' });
      if (!result.authorize_url || !result.authorize_url.startsWith('https://github.com/')) {
        throw new Error('The GitHub authorization URL was invalid.');
      }
      window.location.assign(result.authorize_url);
      // Navigation begins immediately; this value is not shown as a sync timestamp.
      return { last_synced_at: '' };
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
    listNotifications: async (_studentId: string): Promise<NotificationItem[]> => {
      const current = await this.getCurrentStudentRow();
      const { data, error } = await this.client
        .from('notifications')
        .select('id,user_id,kind,payload,read_at,created_at')
        .eq('user_id', current.user_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapNotification(row as Record<string, unknown>, String(current.id)));
    },

    markNotificationRead: async (notificationId: string): Promise<void> => {
      const { data: { user }, error: userError } = await this.client.auth.getUser();
      if (userError || !user) throw new Error('Authentication required');
      const { error } = await this.client
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);
      if (error) throw error;
    },

    markAllNotificationsRead: async (_studentId: string): Promise<void> => {
      const { data: { user }, error: userError } = await this.client.auth.getUser();
      if (userError || !user) throw new Error('Authentication required');
      const { error } = await this.client
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);
      if (error) throw error;
    },

    subscribeNotifications: (
      _studentId: string,
      onNotification: (item: NotificationItem) => void
    ): (() => void) => {
      let disposed = false;
      let channel: ReturnType<typeof this.client.channel> | null = null;

      void this.client.auth.getUser().then(({ data, error }) => {
        if (disposed || error || !data.user) return;
        const userId = data.user.id;
        channel = this.client
          .channel(`student_notifications_${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (!disposed) {
                void this.getCurrentStudentRow().then((student) => {
                  if (!disposed) onNotification(mapNotification(payload.new as Record<string, unknown>, String(student.id)));
                }).catch(() => undefined);
              }
            }
          )
          .subscribe();
      }).catch(() => undefined);

      return () => {
        disposed = true;
        if (channel) void this.client.removeChannel(channel);
      };
    },
  };

  // ---------------- CONFIG ----------------
  config = {
    getPublicConfig: async (): Promise<PublicConfig> => {
      const keys = [
        'PASS_MARK',
        'BORDERLINE_LOW',
        'BORDERLINE_HIGH',
        'REQUIRE_VIDEO',
        'VIDEO_MAX_MB',
        'VIDEO_MAX_SECONDS',
        'AI_KILL_SWITCH',
        'AI_DAILY_CAP_PER_USER',
      ];
      const { data, error } = await this.client
        .from('public_config')
        .select('key,value')
        .in('key', keys);
      if (error) throw error;

      const values = new Map((data ?? []).map((row) => [String(row.key), row.value as unknown]));
      const numberValue = (key: string, fallback: number): number => {
        const value = values.get(key);
        const number = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(number) ? number : fallback;
      };
      const booleanValue = (key: string, fallback: boolean): boolean => {
        const value = values.get(key);
        return typeof value === 'boolean' ? value : fallback;
      };

      return {
        pass_mark: numberValue('PASS_MARK', 50),
        borderline_low: numberValue('BORDERLINE_LOW', 40),
        borderline_high: numberValue('BORDERLINE_HIGH', 60),
        require_video: booleanValue('REQUIRE_VIDEO', true),
        video_max_mb: numberValue('VIDEO_MAX_MB', env.VITE_VIDEO_MAX_MB),
        video_max_seconds: numberValue('VIDEO_MAX_SECONDS', env.VITE_VIDEO_MAX_SECONDS),
        ai_kill_switch: booleanValue('AI_KILL_SWITCH', false),
        ai_daily_cap_per_user: numberValue('AI_DAILY_CAP_PER_USER', 5),
      };
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
