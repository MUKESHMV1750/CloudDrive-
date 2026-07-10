// ============================================================
// supabase.js — Supabase Client Initialization
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your values
// ============================================================

const SUPABASE_URL  = 'https://qzponjtndrbsjdpplelr.supabase.co';
const SUPABASE_ANON = 'sb_publishable_DyXzJOxsa42WDRB5x_1Ivg_DZ13u0m7';

// Initialize client from CDN
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: true
  }
});

// ---- Storage bucket name ----
const BUCKET = 'drive-storage';

// ---- Storage limit per user (15 GB) ----
const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024;

export { sb, BUCKET, STORAGE_LIMIT, SUPABASE_URL, SUPABASE_ANON };
