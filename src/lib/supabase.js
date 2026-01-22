import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = 'https://dmmmwudmypwcchkxchlg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbW13dWRteXB3Y2Noa3hjaGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NzgxMjgsImV4cCI6MjA4NDA1NDEyOH0.p-YhlQ9Tj4YrEIIcuY_uWWwIsHBAlBZQqp3KlFLt4fc';

// Create a single Supabase client instance for the entire app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'employee-status-auth',
  },
});

// Allowed email domain for company restriction
export const ALLOWED_EMAIL_DOMAIN = '@getrime.com';

export default supabase;
