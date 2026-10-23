// Generated Supabase Database Types for AptoHire Backend
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'student' | 'university' | 'organization' | 'admin';
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role: 'student' | 'university' | 'organization' | 'admin';
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: 'student' | 'university' | 'organization' | 'admin';
          display_name?: string | null;
          created_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          primary_email: string | null;
          photo_path: string | null;
          headline: string | null;
          bio: string | null;
          credential_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          primary_email?: string | null;
          photo_path?: string | null;
          headline?: string | null;
          bio?: string | null;
          credential_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          primary_email?: string | null;
          photo_path?: string | null;
          headline?: string | null;
          bio?: string | null;
          credential_id?: string;
          created_at?: string;
        };
      };
      universities: {
        Row: {
          id: string;
          name: string;
          short_name: string | null;
          tier: 'tier1' | 'tier2' | 'tier3' | 'other' | null;
          kind: string | null;
          city: string | null;
          state: string | null;
          email_domains: string[];
          status: 'pending' | 'approved' | 'rejected' | 'unregistered';
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name?: string | null;
          tier?: 'tier1' | 'tier2' | 'tier3' | 'other' | null;
          kind?: string | null;
          city?: string | null;
          state?: string | null;
          email_domains?: string[];
          status?: 'pending' | 'approved' | 'rejected' | 'unregistered';
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string | null;
          tier?: 'tier1' | 'tier2' | 'tier3' | 'other' | null;
          kind?: string | null;
          city?: string | null;
          state?: string | null;
          email_domains?: string[];
          status?: 'pending' | 'approved' | 'rejected' | 'unregistered';
          approved_at?: string | null;
          created_at?: string;
        };
      };
      affiliations: {
        Row: {
          id: string;
          student_id: string;
          university_id: string | null;
          university_name_text: string | null;
          program_level: string;
          year: number;
          status: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
          is_verified: boolean;
          verification_type: 'roster' | 'student_id' | 'unverified';
          started_at: string;
          ended_at: string | null;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          university_id?: string | null;
          university_name_text?: string | null;
          program_level?: string;
          year?: number;
          status?: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
          is_verified?: boolean;
          verification_type?: 'roster' | 'student_id' | 'unverified';
          started_at?: string;
          ended_at?: string | null;
          is_current?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          university_id?: string | null;
          university_name_text?: string | null;
          program_level?: string;
          year?: number;
          status?: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
          is_verified?: boolean;
          verification_type?: 'roster' | 'student_id' | 'unverified';
          started_at?: string;
          ended_at?: string | null;
          is_current?: boolean;
          created_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          slug: string;
          name: string;
          family: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          family: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          family?: string;
          description?: string | null;
        };
      };
      submissions: {
        Row: {
          id: string;
          student_id: string;
          assignment_id: string | null;
          title: string;
          description: string | null;
          skills_claimed: string[];
          live_url: string | null;
          github_url: string | null;
          video_url: string | null;
          video_source: string;
          video_duration_seconds: number | null;
          documents: Json;
          originality_responses: Json;
          ai_used: boolean;
          ai_tools: string[];
          ai_notes: string | null;
          status: 'draft' | 'submitted' | 'auditing' | 'scored' | 'needs_review' | 'appealed' | 'failed';
          submitted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          assignment_id?: string | null;
          title: string;
          description?: string | null;
          skills_claimed: string[];
          live_url?: string | null;
          github_url?: string | null;
          video_url?: string | null;
          video_source?: string;
          video_duration_seconds?: number | null;
          documents?: Json;
          originality_responses?: Json;
          ai_used?: boolean;
          ai_tools?: string[];
          ai_notes?: string | null;
          status?: 'draft' | 'submitted' | 'auditing' | 'scored' | 'needs_review' | 'appealed' | 'failed';
          submitted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          assignment_id?: string | null;
          title?: string;
          description?: string | null;
          skills_claimed?: string[];
          live_url?: string | null;
          github_url?: string | null;
          video_url?: string | null;
          video_source?: string;
          video_duration_seconds?: number | null;
          documents?: Json;
          originality_responses?: Json;
          ai_used?: boolean;
          ai_tools?: string[];
          ai_notes?: string | null;
          status?: 'draft' | 'submitted' | 'auditing' | 'scored' | 'needs_review' | 'appealed' | 'failed';
          submitted_at?: string | null;
          created_at?: string;
        };
      };
      audits: {
        Row: {
          id: string;
          submission_id: string;
          run_id: string | null;
          rubric_version: string;
          prompt_version: string;
          overall_score: number;
          confidence: number;
          level: string;
          criteria_breakdown: Json;
          evidence_spans: Json;
          review_status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
      };
      skill_scores: {
        Row: {
          student_id: string;
          skill_id: string;
          score: number;
          level: string;
          verified: boolean;
          confidence: number | null;
          best_audit_id: string | null;
          updated_at: string;
        };
      };
      access_requests: {
        Row: {
          id: string;
          organization_id: string;
          job_id: string | null;
          match_result_id: string | null;
          student_id: string;
          message: string | null;
          requested_scopes: string[];
          duration_days: number;
          status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';
          granted_scopes: string[] | null;
          expires_at: string | null;
          responded_at: string | null;
          created_at: string;
        };
      };
      app_config: {
        Row: {
          key: string;
          value: Json;
        };
      };
    };
  };
}
