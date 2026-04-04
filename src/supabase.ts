import { createClient } from '@supabase/supabase-js';

// These will be provided by the environment via --define
// We add guards for build-time/prerendering where they might be undefined
const supabaseUrl = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && SUPABASE_URL !== 'https://placeholder.supabase.co') ? SUPABASE_URL : '';
const supabaseKey = (typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'placeholder') ? SUPABASE_ANON_KEY : '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials are not configured. Please add SUPABASE_URL and SUPABASE_ANON_KEY to your secrets.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
);

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
