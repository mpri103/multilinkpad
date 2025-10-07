# MultiLinkPad

Futuristic neon-themed link sharing platform using pure HTML, CSS, and Vanilla JS with Supabase backend and Adsterra monetization.

## Quick start
1. Open `index.html` locally to create a pad.
2. Configure `js/config.js` with your Supabase URL and anon key, plus Adsterra script/slot IDs.
3. Deploy static files to Vercel/Netlify/GitHub Pages/Cloudflare Pages.
4. Implement Supabase Edge Functions: `create-pad`, `get-pad`, `verify-pad`, `track-click`.

## Files
- index.html: Landing page
- share.html: Pad viewer
- admin.html: Optional dashboard stub
- css/: style.css, neon.css, ads.css
- js/: config, supabase, app, create-pad, view-pad, ads, gdpr, utils

## Configuration
Edit `js/config.js`:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- ADSTERRA_* placeholders

## Notes
- Ad slots reserve space with CSS to prevent layout shifts.
- URL validation prevents javascript:, data:, file: schemes.
- Password-protected pads require verification via Edge Function.

## License
MIT (replace as needed)
