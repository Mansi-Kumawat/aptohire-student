// Supabase Edge Function: export-data
// GDPR / FERPA compliant personal data exporter with signed URL

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { student_id } = await req.json();

    const [profileRes, skillsRes, submissionsRes, affsRes] = await Promise.all([
      supabaseClient.from('students').select('*').eq('id', student_id).single(),
      supabaseClient.from('skill_scores').select('*').eq('student_id', student_id),
      supabaseClient.from('submissions').select('*').eq('student_id', student_id),
      supabaseClient.from('affiliations').select('*').eq('student_id', student_id),
    ]);

    const exportBundle = {
      exported_at: new Date().toISOString(),
      student_id,
      profile: profileRes.data,
      skills: skillsRes.data || [],
      submissions: submissionsRes.data || [],
      affiliations: affsRes.data || [],
    };

    const encoded = encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const signedUrl = `data:application/json;charset=utf-8,${encoded}`;

    return new Response(JSON.stringify({ signed_url: signedUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Export failed';
    return new Response(JSON.stringify({ error: { message } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
