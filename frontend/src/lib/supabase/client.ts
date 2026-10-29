import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const url = env.VITE_SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before disabling mocks.'
    );
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid HTTPS Supabase URL.');
  }
  const localDevelopmentHost = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
  if (parsedUrl.protocol !== 'https:' && !(env.VITE_APP_ENV === 'local' && localDevelopmentHost)) {
    throw new Error('VITE_SUPABASE_URL must use HTTPS outside local development.');
  }
  if (/placeholder|example/i.test(parsedUrl.hostname)) {
    throw new Error('VITE_SUPABASE_URL is still a placeholder. Configure the project URL.');
  }
  if (anonKey === 'placeholder-anon-key') {
    throw new Error('VITE_SUPABASE_ANON_KEY is still a placeholder. Configure the project anon key.');
  }

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
