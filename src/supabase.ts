import { createBrowserClient } from '@supabase/ssr';

// These will be provided by the environment via --define
// We add guards for build-time/prerendering where they might be undefined
const getEnv = (name: string, placeholder: string) => {
  const val = (globalThis as Record<string, unknown>)[name];
  return (typeof val !== 'undefined' && val && val !== placeholder) ? (val as string) : '';
};

const supabaseUrl = getEnv('SUPABASE_URL', 'https://placeholder.supabase.co') || 
                    getEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder.supabase.co');

const supabaseKey = getEnv('SUPABASE_ANON_KEY', 'placeholder') || 
                    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder') ||
                    getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'placeholder');

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials are not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your secrets.');
}

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
