import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://dmmmwudmypwcchkxchlg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbW13dWRteXB3Y2Noa3hjaGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzgxMjgsImV4cCI6MjA4NDA1NDEyOH0.p-YhlQ9Tj4YrEIIcuY_uWWwIsHBAlBZQqp3KlFLt4fc';

// ─── Authenticated client ────────────────────────────────────────────────────
// Used for auth, writes, and operations that need the user session.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'employee-status-auth',
  },
});

// ─── Public read-only client ─────────────────────────────────────────────────
// Supabase JS v2 holds an internal async lock while validating / refreshing the
// stored session. Any query made via the main client during that lock hangs
// indefinitely. This client has NO session tracking so it is NEVER blocked —
// it always fires immediately using the anon key.
// Use this for all public SELECT queries (e.g. fetching the employee list).
// The user_profiles SELECT RLS policy is USING (true) so anon reads are fine.
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'employee-status-auth-public-readonly',
  },
});

// Allowed email domain for company restriction
export const ALLOWED_EMAIL_DOMAIN = '@getrime.com';

export default supabase;
