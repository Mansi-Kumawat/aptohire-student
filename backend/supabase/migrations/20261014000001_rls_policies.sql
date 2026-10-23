-- ==============================================================================
-- AptoHire Database Security: Row Level Security (RLS) Policies & Helper Functions
-- Spec: architecture.md §7, Security.md §2
-- ==============================================================================

-- 1. Helper Functions (SECURITY DEFINER, search_path = '')
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.my_student_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.has_active_grant(target_org_id UUID, target_student_id UUID, required_scope TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.access_requests
    WHERE organization_id = target_org_id
      AND student_id = target_student_id
      AND status = 'accepted'
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (required_scope = ANY(granted_scopes) OR granted_scopes IS NULL)
  );
$$;

-- 2. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- 3. Profiles Policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own display_name" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 4. Students Policies
CREATE POLICY "Students read own record" ON students
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students update own record" ON students
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. Universities & Rosters
CREATE POLICY "Public can view approved universities" ON universities
  FOR SELECT USING (status = 'approved' OR public.is_admin());

CREATE POLICY "Students read own affiliations" ON affiliations
  FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());

CREATE POLICY "Students update own affiliations" ON affiliations
  FOR UPDATE USING (student_id = public.my_student_id()) WITH CHECK (student_id = public.my_student_id());

-- 6. Skills & Knowledge Graph
CREATE POLICY "Public read skills" ON skills
  FOR SELECT USING (TRUE);

CREATE POLICY "Public read skill edges" ON skill_edges
  FOR SELECT USING (TRUE);

-- 7. Assignments & Submissions
CREATE POLICY "Students view own project assignments" ON project_assignments
  FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());

CREATE POLICY "Students view own submissions" ON submissions
  FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());

CREATE POLICY "Students insert own submissions" ON submissions
  FOR INSERT WITH CHECK (student_id = public.my_student_id());

CREATE POLICY "Students update own draft submissions" ON submissions
  FOR UPDATE USING (student_id = public.my_student_id() AND status IN ('draft', 'needs_review'))
  WITH CHECK (student_id = public.my_student_id());

-- 8. Audits & Scores
CREATE POLICY "Students view audits for their submissions" ON audits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.id = audits.submission_id AND s.student_id = public.my_student_id()
    ) OR public.is_admin()
  );

CREATE POLICY "Students view own skill scores" ON skill_scores
  FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());

CREATE POLICY "Students view own skill score history" ON skill_score_history
  FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());

-- 9. Tickets
CREATE POLICY "Students view and create their own tickets" ON tickets
  FOR ALL USING (student_id = public.my_student_id() OR public.is_admin())
  WITH CHECK (student_id = public.my_student_id());

-- 10. Access Requests & Consent
CREATE POLICY "Students view and respond to their access requests" ON access_requests
  FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());

CREATE POLICY "Students respond to access requests" ON access_requests
  FOR UPDATE USING (student_id = public.my_student_id())
  WITH CHECK (student_id = public.my_student_id());

CREATE POLICY "Students view feedback addressed to them" ON feedback
  FOR SELECT USING (student_id = public.my_student_id() OR public.is_admin());

-- 11. Notifications
CREATE POLICY "Users view and update their own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid());

-- 12. App Config (Read-only for public values)
CREATE POLICY "Public read app_config" ON app_config
  FOR SELECT USING (TRUE);

-- 13. Supabase Storage: Owner-Scoped Private Buckets & Signed URLs
-- All buckets are private (public = false); downloads require signed URLs generated via createSignedUrl
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', false, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('videos', 'videos', false, 52428800, ARRAY['video/mp4', 'video/webm']),
  ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'text/markdown', 'text/plain'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Owner-scoped private download for avatars, videos, and documents
CREATE POLICY "Owner-scoped private download for avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner-scoped private download for videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner-scoped private download for documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Owner-scoped upload for avatars, videos, and documents
CREATE POLICY "Owner-scoped upload for avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner-scoped upload for videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner-scoped upload for documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Owner-scoped update for avatars, videos, and documents
CREATE POLICY "Owner-scoped update for avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner-scoped update for videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner-scoped update for documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Owner-scoped delete for avatars, videos, and documents
CREATE POLICY "Owner-scoped delete for avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner-scoped delete for videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner-scoped delete for documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

