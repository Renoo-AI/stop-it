import { createClient } from '@supabase/supabase-js';

// These will be provided by the environment via --define
// We add guards for build-time/prerendering where they might be undefined
const supabaseUrl = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) ? SUPABASE_URL : 'https://placeholder.supabase.co';
const supabaseKey = (typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY) ? SUPABASE_ANON_KEY : 'placeholder';

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
