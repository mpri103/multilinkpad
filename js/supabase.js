// Ensure Supabase SDK is loaded from CDN before this file
if (!window.supabase) {
  console.error('Supabase SDK not loaded. Include CDN before supabase.js');
}

const supabase = window.supabase?.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
