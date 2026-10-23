// Supabase Edge Function: confirm-affiliation
// Follows Deno serve contract and Security Definer execution

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

interface ConfirmAffiliationPayload {
  student_id: string;
  proposal_id?: string;
  new?: {
    university_id?: string;
    university_name?: string;
    program_level?: 'ug' | 'pg';
    year?: number;
    status?: 'incoming' | 'enrolled' | 'dropout' | 'alumni' | 'masters';
  };
}

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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: { message: 'Unauthorized' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload: ConfirmAffiliationPayload = await req.json();

    // Preserve existing verified scores when switching university
    const { data: affiliation, error } = await supabaseClient
      .from('affiliations')
      .insert({
        student_id: payload.student_id,
        university_id: payload.new?.university_id || null,
        university_name_text: payload.new?.university_name || 'Independent University',
        program_level: payload.new?.program_level || 'ug',
        year: payload.new?.year || 1,
        status: payload.new?.status || 'enrolled',
        is_verified: !!payload.proposal_id,
        is_current: true,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify(affiliation), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: { message } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
