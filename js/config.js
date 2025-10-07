const CONFIG = {
  SUPABASE_URL: 'https://rdjjskpfrubmrbjvybwt.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkampza3BmcnVibXJianZ5Ynd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTAzOTUsImV4cCI6MjA3NDY4NjM5NX0.Z158ruTVqtmO9kLiZLr36I-CHmRmUkmkbug6QhWFY-s',
  ADSTERRA_PUBLISHER_ID: 'your_publisher_id',
  ADSTERRA_SLOTS: {
    leaderboard: 'LEADERBOARD_SLOT_ID',
    native: 'NATIVE_SLOT_ID',
    interstitial: 'INTERSTITIAL_SLOT_ID',
    sticky: 'STICKY_SLOT_ID'
  },
  SITE_ORIGIN: typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'
};
