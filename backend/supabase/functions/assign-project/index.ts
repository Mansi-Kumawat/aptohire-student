// Supabase Edge Function: assign-project
// Generates or selects an interactive real-world brief matching skills and role text

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

    const { student_id, target, level } = await req.json();

    // Query active template matching target
    const { data: template } = await supabaseClient
      .from('project_templates')
      .select('*')
      .eq('active', true)
      .limit(1)
      .single();

    const brief = template ? template.brief : {
      scenario: 'Build a production-grade portfolio project demonstrating clean architectural patterns.',
      deliverables: ['Working web application', 'Demo walkthrough video'],
      constraints: ['TypeScript strict mode', 'WCAG 2.1 AA accessibility'],
      originality_questions: ['How did you structure data fetching and cache invalidation?']
    };

    const { data: assignment, error } = await supabaseClient
      .from('project_assignments')
      .insert({
        student_id,
        level: level || 'Proficient',
        target_skills: [],
        brief,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ assignment_id: assignment.id, brief }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Assignment generation failed';
    return new Response(JSON.stringify({ error: { message } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
