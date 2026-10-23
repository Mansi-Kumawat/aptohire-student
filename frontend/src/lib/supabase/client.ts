import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const url = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  supabaseClient = createClient(url, anonKey, {
    auth: {
      storageKey: 'aptohire-student',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  return supabaseClient;
}
