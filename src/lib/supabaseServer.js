import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// Read environment variables at runtime (from Vercel)
const supabaseUrl = env.SUPABASE_URL ?? null;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? null;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default supabase;
