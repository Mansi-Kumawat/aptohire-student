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
import { levelFor, isBorderline } from '../../scoring';
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

  private async mapSubmissionRow(row: Record<string, unknown>, studentId: string): Promise<Submission> {
    const claimedIds = Array.isArray(row.claimed_skill_ids)
      ? row.claimed_skill_ids.filter((id): id is string => typeof id === 'string')
      : [];
    const { data: skillRows, error: skillsError } = claimedIds.length
      ? await this.client.from('skills').select('id,name').in('id', claimedIds)
      : { data: [], error: null };
    if (skillsError) throw skillsError;
    const answers = asRecord(row.originality_answers);
    const rawResponses = Array.isArray(row.originality_answers)
      ? row.originality_answers
      : Array.isArray(answers.responses) ? answers.responses : [];
    const responses = rawResponses.filter((item): item is { question: string; answer: string; answered_in_video?: boolean } => {
      const value = asRecord(item);
      return typeof value.question === 'string' && typeof value.answer === 'string';
    });
    const rawPaths = Array.isArray(row.document_paths)
      ? row.document_paths.filter((path): path is string => typeof path === 'string')
      : [];
    const documents: SubmissionDocument[] = rawPaths.map((path) => {
      const name = path.split('/').pop() ?? path;
      const ext = name.includes('.') ? name.split('.').pop() ?? '' : '';
      return { id: path, name, size: 0, url: path, ext };
    });
    const videoPath = typeof row.video_path === 'string' ? row.video_path : null;
    const videoUrl = typeof row.video_url === 'string' ? row.video_url : null;
    const videoSource: Submission['video_source'] = videoPath
      ? 'upload'
      : videoUrl ? 'link' : 'none';

    return {
      id: String(row.id ?? ''),
      student_id: studentId,
      assignment_id: typeof answers.assignment_id === 'string' ? answers.assignment_id : null,
      title: String(row.title ?? ''),
      description: String(row.description ?? ''),
      skills_claimed: (skillRows ?? []).map((skill) => String(skill.name)),
      video_url: videoPath ?? videoUrl,
      ...(typeof row.video_seconds === 'number' ? { video_duration_seconds: row.video_seconds } : {}),
      ...(typeof row.video_bytes === 'number' ? { video_size_bytes: row.video_bytes } : {}),
      video_source: videoSource,
      documents,
      live_url: typeof row.live_url === 'string' ? row.live_url : null,
      github_url: typeof row.github_url === 'string' ? row.github_url : null,
      originality_responses: responses,
      ai_used: answers.ai_used === true,
      ai_tools: Array.isArray(answers.ai_tools) ? answers.ai_tools.filter((item): item is string => typeof item === 'string') : [],
      ai_notes: typeof answers.ai_notes === 'string' ? answers.ai_notes : '',
      status: row.status as Submission['status'],
      created_at: String(row.created_at ?? ''),
      updated_at: String(row.updated_at ?? ''),
    };
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
      const response = await this.callEdgeFunction<
        { full_name: string; program_level: 'ug' | 'pg'; year?: number; choice: RegisterStudentInput['choice'] },
        {
          student_id: string;
          outcome: RegisterResult['outcome'];
          affiliation?: { university_id?: string; label: string; verification: 'roster' | 'student_id' | 'unverified' };
          matched_existing_person: boolean;
        }
      >('register-student', {
        full_name: input.full_name,
        program_level: input.program_level,
        ...(input.year !== undefined ? { year: input.year } : {}),
        choice: input.choice,
      });
      return {
        student_id: response.student_id,
        outcome: response.outcome,
        matched_existing_person: response.matched_existing_person,
      };
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
    getPublicCredential: async (credentialId: string): Promise<PublicCredential | null> => {
      if (!/^[a-f0-9]{18}$/i.test(credentialId)) return null;
      if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
        throw new Error('Supabase is not configured for public credential verification.');
      }
      const baseUrl = env.VITE_SUPABASE_URL.replace(/\/$/, '');
      const response = await fetch(
        `${baseUrl}/functions/v1/public-verify?id=${encodeURIComponent(credentialId)}`,
        { method: 'GET', headers: { apikey: env.VITE_SUPABASE_ANON_KEY } }
      );
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Credential verification is temporarily unavailable.');
      const result = await response.json() as { credential?: PublicCredential };
      if (!result.credential || result.credential.credential_id !== credentialId) return null;
      return result.credential;
    },
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
    listAffiliations: async (_studentId: string): Promise<Affiliation[]> => {
      const student = await this.getCurrentStudentRow();
      const { data, error } = await this.client
        .from('affiliations')
        .select('id,student_id,university_id,university_name_text,verification,program_level,year,status,is_current,started_on,ended_on,universities(name,short_name)')
        .eq('student_id', student.id)
        .order('is_current', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const university = row.universities as { name?: string; short_name?: string | null } | null;
        const status = row.status === 'incoming' || row.status === 'alumni' || row.status === 'dropout'
          ? row.status
          : 'enrolled';
        const verification = row.verification === 'roster' || row.verification === 'student_id'
          ? row.verification
          : 'unverified';
        return {
          id: row.id,
          student_id: row.student_id,
          university_id: row.university_id,
          university_name: row.university_name_text ?? university?.name ?? university?.short_name ?? '',
          ...(row.program_level === 'pg' || row.program_level === 'ug' ? { program_level: row.program_level } : {}),
          ...(row.year !== null ? { year: row.year } : {}),
          status,
          is_verified: verification !== 'unverified',
          verification_type: verification,
          started_at: row.started_on,
          ...(row.ended_on ? { ended_at: row.ended_on } : {}),
          is_current: row.is_current,
        };
      });
    },
    listProposals: async (_studentId: string): Promise<AffiliationProposal[]> => {
      const { data, error } = await this.client
        .from('my_affiliation_proposals')
        .select('id,student_id,university_id,university_name,program_level,status,year,proposal_state,created_at')
        .eq('proposal_state', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        student_id: row.student_id,
        university_id: row.university_id,
        university_name: row.university_name,
        ...(row.program_level === 'pg' || row.program_level === 'ug' ? { program_level: row.program_level } : {}),
        year: row.year ?? 1,
        status: row.status === 'incoming' || row.status === 'alumni' || row.status === 'dropout'
          ? row.status
          : 'enrolled',
        is_verified: false,
        created_at: row.created_at,
      }));
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
        ...(item.program_level === 'pg' || item.program_level === 'ug' ? { program_level: item.program_level } : {}),
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
        .from('public_universities')
        .select('id,name,short_name,city,state');
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        slug: undefined,
        email_domains: [],
        short_name: row.short_name,
        city: row.city,
        state: row.state,
      }));
    },
  };

  // ---------------- SKILLS ----------------
  skills = {
    listSkills: async (): Promise<SkillItem[]> => {
      const { data, error } = await this.client
        .from('skills')
        .select('id,name,slug,family_id,skill_families(name)')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((row) => {
        const family = row.skill_families as { name?: string } | null;
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          family: family?.name ?? 'Other',
        };
      });
    },
    listSkillEdges: async (): Promise<SkillEdge[]> => {
      const { data, error } = await this.client
        .from('skill_edges')
        .select('from_skill_id,to_skill_id');
      if (error) throw error;
      return (data ?? []).map((row) => ({
        source: row.from_skill_id,
        target: row.to_skill_id,
      }));
    },
  };

  // ---------------- PROJECTS ----------------
  projects = {
    listAssignments: async (_studentId: string): Promise<ProjectAssignment[]> => {
      const student = await this.getCurrentStudentRow();
      const { data, error } = await this.client
        .from('project_assignments')
        .select('id,student_id,template_id,status,brief,created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        student_id: row.student_id,
        brief: row.brief as ProjectBrief,
        status: row.status as ProjectAssignment['status'],
        created_at: row.created_at,
      }));
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
      status: 'in_progress'
    ): Promise<ProjectAssignment> => {
      if (status !== 'in_progress') throw new Error('The backend only permits starting an assigned project here.');
      const { data, error } = await this.client
        .from('project_assignments')
        .update({ status: 'in_progress' })
        .eq('id', assignmentId)
        .select('id,student_id,template_id,status,brief,created_at')
        .single();
      if (error) throw error;
      return {
        id: data.id,
        student_id: data.student_id,
        brief: data.brief as ProjectBrief,
        status: data.status as ProjectAssignment['status'],
        created_at: data.created_at,
      };
    },
  };

  // ---------------- SUBMISSIONS ----------------
  submissions = {
    listSubmissions: async (_studentId: string): Promise<Submission[]> => {
      const student = await this.getCurrentStudentRow();
      const { data, error } = await this.client
        .from('submissions')
        .select('id,student_id,template_id,title,description,status,claimed_skill_ids,video_path,video_url,video_seconds,video_bytes,originality_answers,live_url,github_url,document_paths,created_at,updated_at')
        .eq('student_id', student.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return Promise.all((data ?? []).map((row) => this.mapSubmissionRow(row as Record<string, unknown>, String(student.id))));
    },
    getSubmission: async (submissionId: string): Promise<Submission | null> => {
      const student = await this.getCurrentStudentRow();
      const { data, error } = await this.client
        .from('submissions')
        .select('id,student_id,template_id,title,description,status,claimed_skill_ids,video_path,video_url,video_seconds,video_bytes,originality_answers,live_url,github_url,document_paths,created_at,updated_at')
        .eq('id', submissionId)
        .eq('student_id', student.id)
        .maybeSingle();
      if (error) throw error;
      return data ? this.mapSubmissionRow(data as Record<string, unknown>, String(student.id)) : null;
    },
    saveDraft: async (
      draft: Partial<Submission> & { student_id: string }
    ): Promise<Submission> => {
      const student = await this.getCurrentStudentRow();
      const skillNames = draft.skills_claimed ?? [];
      const { data: skillRows, error: skillsError } = skillNames.length
        ? await this.client.from('skills').select('id,name').in('name', skillNames)
        : { data: [], error: null };
      if (skillsError) throw skillsError;
      const skillMap = new Map((skillRows ?? []).map((skill) => [String(skill.name), String(skill.id)]));
      const missingSkills = skillNames.filter((name) => !skillMap.has(name));
      if (missingSkills.length) throw new Error('One or more claimed skills are not in the catalog.');

      let templateId: string | null = null;
      if (draft.assignment_id) {
        const { data: assignment, error: assignmentError } = await this.client
          .from('project_assignments')
          .select('template_id')
          .eq('id', draft.assignment_id)
          .eq('student_id', student.id)
          .maybeSingle();
        if (assignmentError) throw assignmentError;
        if (!assignment) throw new Error('The selected project assignment could not be found.');
        templateId = assignment.template_id;
      }

      const videoPath = draft.video_source === 'upload' && draft.video_url ? draft.video_url : null;
      const videoLink = draft.video_source === 'link' && draft.video_url ? draft.video_url : null;
      const originalityAnswers = {
        responses: draft.originality_responses ?? [],
        ai_used: draft.ai_used ?? false,
        ai_tools: draft.ai_tools ?? [],
        ai_notes: draft.ai_notes ?? '',
        assignment_id: draft.assignment_id ?? null,
      };
      const fields = {
        title: draft.title ?? '',
        description: draft.description ?? '',
        claimed_skill_ids: skillNames.map((name) => skillMap.get(name)!),
        video_path: videoPath,
        video_url: videoLink,
        video_seconds: draft.video_duration_seconds ?? null,
        video_bytes: draft.video_size_bytes ?? null,
        originality_answers: originalityAnswers,
        live_url: draft.live_url ?? null,
        github_url: draft.github_url ?? null,
        document_paths: (draft.documents ?? []).map((doc) => doc.url),
      };

      const submissionId = draft.id && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(draft.id) ? draft.id : null;
      const query = submissionId
        ? this.client.from('submissions').update(fields).eq('id', submissionId).eq('student_id', student.id).eq('status', 'draft')
        : this.client.from('submissions').insert({
            ...fields,
            student_id: student.id,
            template_id: templateId,
            status: 'draft',
          });
      const { data, error } = await query
        .select('id,student_id,template_id,title,description,status,claimed_skill_ids,video_path,video_url,video_seconds,video_bytes,originality_answers,live_url,github_url,document_paths,created_at,updated_at')
        .single();
      if (error) throw error;
      return this.mapSubmissionRow(data as Record<string, unknown>, String(student.id));
    },
    submitProject: async (params: {
      submission_id: string;
      confirm: boolean;
    }): Promise<{ run_id: string; status: string; mode: string }> => {
      if (params.confirm !== true) throw new Error('Confirm the submission before sending it for review.');
      return this.callEdgeFunction('submit-project', {
        submission_id: params.submission_id,
        confirm: true,
      });
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
      const student = await this.getCurrentStudentRow();
      const { data: { session } } = await this.client.auth.getSession();
      if (!session?.access_token) throw new Error('Authentication required for video upload');
      if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(submissionId)) throw new Error('Save the submission draft before uploading video.');
      const ext = file.name.split('.').pop() || 'mp4';
      if (!env.VITE_SUPABASE_URL) throw new Error('Supabase storage is not configured.');
      const endpoint = `${env.VITE_SUPABASE_URL.replace(/\/$/, '')}/storage/v1/upload/resumable`;

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
            objectName: `${student.id}/${submissionId}/demo.${ext}`,
            contentType: file.type,
          },
          chunkSize: 6 * 1024 * 1024,
          onError: (error) => reject(error),
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
            if (onProgress) onProgress(percentage);
          },
          onSuccess: () => {
            const path = `${student.id}/${submissionId}/demo.${ext}`;
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
      const student = await this.getCurrentStudentRow();
      if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(submissionId)) throw new Error('Save the submission draft before uploading documents.');
      const ext = file.name.split('.').pop() || 'pdf';
      const safeName = file.name.replace(/[\\/\\\\]/g, '_');
      const path = `${student.id}/${submissionId}/${safeName}`;

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
        .select('id,submission_id,created_at,overall_score,confidence,summary,rubric,evidence,next_steps,transcript,review_status')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const rawStatus = String(data.review_status ?? 'unreviewed');
      const review_status: Audit['review_status'] = rawStatus === 'pending' || rawStatus === 'confirmed' || rawStatus === 'adjusted'
        ? rawStatus
        : 'none';
      return {
        id: data.id,
        submission_id: data.submission_id,
        created_at: data.created_at,
        overall: Number(data.overall_score ?? 0),
        confidence: Number(data.confidence ?? 0),
        summary: data.summary ?? '',
        next_steps: Array.isArray(data.next_steps) ? data.next_steps.filter((item): item is string => typeof item === 'string') : [],
        flags: [],
        borderline: review_status === 'pending',
        review_status,
        per_skill: [],
        evidence: Array.isArray(data.evidence) ? data.evidence as Audit['evidence'] : [],
        ...(Array.isArray(data.transcript) ? { transcript: data.transcript as Audit['transcript'] } : {}),
      };
    },
    getAgentRun: async (submissionId: string): Promise<AgentRun | null> => {
      const { data, error } = await this.client
        .from('agent_runs')
        .select('id,submission_id,stage,status,created_at,started_at,finished_at,error_code')
        .eq('submission_id', submissionId)
        .order('started_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const status: AgentRun['status'] = data.status === 'completed' || data.status === 'failed'
        ? data.status
        : 'running';
      return {
        id: data.id,
        submission_id: data.submission_id,
        stage: data.stage as AgentRun['stage'],
        status,
        started_at: data.started_at ?? data.created_at,
        updated_at: data.finished_at ?? data.started_at ?? data.created_at,
        ...(data.error_code ? { error: data.error_code } : {}),
      };
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
            const row = payload.new as Record<string, unknown>;
            if (!row.id) return;
            const createdAt = typeof row.created_at === 'string' ? row.created_at : '';
            const startedAt = typeof row.started_at === 'string' ? row.started_at : createdAt;
            onUpdate({
              id: String(row.id),
              submission_id: String(row.submission_id ?? submissionId),
              stage: row.stage as AgentRun['stage'],
              status: row.status === 'completed' || row.status === 'failed' ? row.status : 'running',
              started_at: startedAt,
              updated_at: typeof row.finished_at === 'string' ? row.finished_at : startedAt,
              ...(typeof row.error_code === 'string' ? { error: row.error_code } : {}),
            });
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
    listSkillScores: async (_studentId: string): Promise<SkillScore[]> => {
      const student = await this.getCurrentStudentRow();
      const { data, error } = await this.client
        .from('skill_scores')
        .select('id,student_id,skill_id,score,level,verified,pending_review,share_ok,audit_id,updated_at,skills!inner(name,slug,family_id,skill_families(name))')
        .eq('student_id', student.id);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const skill = row.skills as { name?: string; slug?: string; skill_families?: { name?: string } | null } | null;
        const score = Number(row.score);
        return {
          id: row.id,
          student_id: row.student_id,
          skill_id: row.skill_id,
          skill_name: skill?.name ?? '',
          skill_slug: skill?.slug ?? '',
          family: skill?.skill_families?.name ?? '',
          score,
          level: levelFor(score),
          is_verified: row.verified === true && row.pending_review !== true,
          is_borderline: isBorderline(score),
          last_reviewed_at: row.updated_at ?? '',
          audit_id: row.audit_id ?? '',
        };
      });
    },
    getSkillScore: async (
      _studentId: string,
      skillSlug: string
    ): Promise<SkillScore | null> => {
      const student = await this.getCurrentStudentRow();
      const { data: skill, error: skillError } = await this.client
        .from('skills')
        .select('id')
        .eq('slug', skillSlug)
        .maybeSingle();
      if (skillError) throw skillError;
      if (!skill) return null;
      const { data, error } = await this.client
        .from('skill_scores')
        .select('id,student_id,skill_id,score,level,verified,pending_review,share_ok,audit_id,updated_at,skills!inner(name,slug,family_id,skill_families(name))')
        .eq('student_id', student.id)
        .eq('skill_id', skill.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const skillData = data.skills as { name?: string; slug?: string; skill_families?: { name?: string } | null } | null;
      const score = Number(data.score);
      return {
        id: data.id,
        student_id: data.student_id,
        skill_id: data.skill_id,
        skill_name: skillData?.name ?? '',
        skill_slug: skillData?.slug ?? '',
        family: skillData?.skill_families?.name ?? '',
        score,
        level: levelFor(score),
        is_verified: data.verified === true && data.pending_review !== true,
        is_borderline: isBorderline(score),
        last_reviewed_at: data.updated_at ?? '',
        audit_id: data.audit_id ?? '',
      };
    },
    listScoreHistory: async (
      _studentId: string,
      skillId?: string
    ): Promise<SkillScoreHistory[]> => {
      const student = await this.getCurrentStudentRow();
      let query = this.client
        .from('skill_score_history')
        .select('id,student_id,skill_id,score,audit_id,created_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: true });
      if (skillId) query = query.eq('skill_id', skillId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        student_id: row.student_id,
        skill_id: row.skill_id,
        score: Number(row.score),
        audit_id: row.audit_id ?? '',
        created_at: row.created_at,
      }));
    },
  };

  // ---------------- TICKETS ----------------
  tickets = {
    listTickets: async (_studentId: string): Promise<Ticket[]> => {
      const student = await this.getCurrentStudentRow();
      const { data, error } = await this.client
        .from('tickets')
        .select('id,submission_id,student_id,reason,status,decision,created_at,resolved_at')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const divider = row.reason.indexOf(' — ');
        const status: Ticket['status'] = row.status === 'closed'
          ? 'decision'
          : row.status === 'assigned'
            ? 'under_review'
            : 'received';
        const decision: Ticket['decision'] | undefined = row.decision === 'upheld'
          ? 'upheld'
          : row.decision === 'adjusted'
            ? 'adjusted'
            : row.decision === 'overturned'
              ? 'rejected'
              : undefined;
        return {
          id: row.id,
          student_id: row.student_id,
          submission_id: row.submission_id,
          skill_name: divider > 0 ? row.reason.slice(0, divider) : '',
          reason: divider > 0 ? row.reason.slice(divider + 3) : row.reason,
          status,
          ...(decision ? { decision } : {}),
          created_at: row.created_at,
          updated_at: row.resolved_at ?? row.created_at,
        };
      });
    },
    createTicket: async (
      input: TicketFormInput & { student_id: string }
    ): Promise<Ticket> => {
      const student = await this.getCurrentStudentRow();
      const reason = `${input.skill_name} — ${input.reason}`;
      const { data, error } = await this.client
        .from('tickets')
        .insert({
          student_id: student.id,
          submission_id: input.submission_id,
          reason,
        })
        .select('id,submission_id,student_id,reason,status,decision,created_at,resolved_at')
        .single();
      if (error) throw error;
      return {
        id: data.id,
        student_id: data.student_id,
        submission_id: data.submission_id,
        skill_name: input.skill_name,
        reason: input.reason,
        status: 'received',
        created_at: data.created_at,
        updated_at: data.created_at,
      };
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
      const student = await this.getCurrentStudentRow();
      const { data, error } = await this.client
        .from('profile_proposals')
        .select('id,source_id,changes,state,created_at,profile_sources(source_type)')
        .eq('student_id', student.id)
        .eq('state', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).flatMap((row): ProfileProposal[] => {
        const changes = Array.isArray(row.changes) ? row.changes : [];
        const sourceRow = row.profile_sources as { source_type?: string } | null;
        const source = sourceRow?.source_type === 'linkedin_export' ? 'linkedin_export'
          : sourceRow?.source_type === 'github' ? 'github'
          : null;
        if (!source || changes.length === 0) return [];
        return [{
          id: row.id,
          state: row.state as ProfileProposal['state'],
          source,
          changes: changes as ProfileProposal['changes'],
        }];
      });
    },
    applyProposal: async (_studentId: string, proposalIndex: number): Promise<void> => {
      const student = await this.getCurrentStudentRow();
      const proposals = await this.sources.listProposals(String(student.id));
      const proposal = proposals[proposalIndex];
      if (!proposal?.id) throw new Error('Profile suggestion is no longer pending. Refresh and try again.');
      const { error } = await this.client
        .from('profile_proposals')
        .update({ state: 'approved' })
        .eq('id', proposal.id)
        .eq('student_id', student.id)
        .eq('state', 'pending');
      if (error) throw error;
    },
    dismissProposal: async (_studentId: string, proposalIndex: number): Promise<void> => {
      const student = await this.getCurrentStudentRow();
      const proposals = await this.sources.listProposals(String(student.id));
      const proposal = proposals[proposalIndex];
      if (!proposal?.id) throw new Error('Profile suggestion is no longer pending. Refresh and try again.');
      const { error } = await this.client
        .from('profile_proposals')
        .update({ state: 'dismissed' })
        .eq('id', proposal.id)
        .eq('student_id', student.id)
        .eq('state', 'pending');
      if (error) throw error;
    },
  };

  // ---------------- SHARING ----------------
  sharing = {
    listAccessRequests: async (_studentId: string): Promise<AccessRequest[]> => {
      const { data, error } = await this.client
        .from('student_access_requests_v')
        .select('id,organization_name,organization_verified,job_title,message,requested_scope,granted_scope,duration_days,status,expires_at,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        organization_name: row.organization_name,
        organization_verified: row.organization_verified === true,
        job_title: row.job_title,
        message: row.message ?? '',
        requested_scopes: Array.isArray(row.requested_scope) ? row.requested_scope as Scope[] : [],
        duration_days: typeof row.duration_days === 'number' ? row.duration_days : 30,
        status: row.status as AccessRequest['status'],
        granted_scopes: Array.isArray(row.granted_scope) ? row.granted_scope as Scope[] : undefined,
        expires_at: row.expires_at ?? undefined,
        created_at: row.created_at,
      }));
    },
    respondAccess: async (
      input: RespondAccessInput
    ): Promise<{ status: string; expires_at?: string }> => {
      return this.callEdgeFunction('respond-access', input);
    },
    withdrawAccess: async (requestId: string): Promise<{ status: 'withdrawn' }> => {
      return this.callEdgeFunction('withdraw-access', { request_id: requestId });
    },
    listFeedback: async (_studentId: string): Promise<FeedbackItem[]> => {
      // The current backend intentionally grants students no SELECT access to organization feedback.
      // Do not issue a forbidden query or fabricate feedback rows in the browser.
      return [];
    },
    subscribeAccessRequests: (
      _studentId: string,
      onRequestChange: (request: AccessRequest) => void
    ): () => void => {
      let disposed = false;
      let channel: ReturnType<typeof this.client.channel> | null = null;
      void this.getCurrentStudentRow().then((student) => {
        if (disposed) return;
        channel = this.client
          .channel(`student_access_requests_${student.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'access_requests',
            filter: `student_id=eq.${student.id}`,
          }, (payload) => {
            const changedId = String((payload.new as Record<string, unknown>)?.id ?? '');
            if (!changedId) return;
            void this.sharing.listAccessRequests(String(student.id)).then((requests) => {
              const changed = requests.find((request) => request.id === changedId);
              if (!disposed && changed) onRequestChange(changed);
            }).catch(() => undefined);
          })
          .subscribe();
      }).catch(() => undefined);
      return () => {
        disposed = true;
        if (channel) void this.client.removeChannel(channel);
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

    markNotificationRead: async (_notificationId: string): Promise<void> => {
      throw new Error('The current backend exposes notifications as read-only.');
    },

    markAllNotificationsRead: async (_studentId: string): Promise<void> => {
      throw new Error('The current backend exposes notifications as read-only.');
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
