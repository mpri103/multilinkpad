# Supabase Functions Deploy Guide

## Prereqs
- Install Supabase CLI: https://supabase.com/docs/guides/cli
- Login: `supabase login`
- Link project: `supabase link --project-ref rdjjskpfrubmrbjvybwt`

## Deploy all functions
```
supabase functions deploy create-pad --no-verify-jwt
supabase functions deploy get-pad --no-verify-jwt
supabase functions deploy verify-pad --no-verify-jwt
supabase functions deploy track-click --no-verify-jwt
```
`--no-verify-jwt` is used because we are authorizing with the anon key via the Authorization header.

## Set function environment variables
Set these for each function or as project-level:
- SUPABASE_URL = https://rdjjskpfrubmrbjvybwt.supabase.co
- SUPABASE_SERVICE_ROLE_KEY = <service_role_key>

CLI examples:
```
supabase functions secrets set SUPABASE_URL=https://rdjjskpfrubmrbjvybwt.supabase.co --project-ref rdjjskpfrubmrbjvybwt
supabase functions secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE --project-ref rdjjskpfrubmrbjvybwt
```

## SQL (optional but recommended)
Create the increment RPC used by track-click:
```sql
create or replace function public.increment_item_clicks(p_item_id uuid)
returns void as $$
  update public.items set clicks = clicks + 1 where id = p_item_id;
$$ language sql security definer;

grant execute on function public.increment_item_clicks(uuid) to anon, authenticated;
```

## Test CORS quickly
Preflight:
```
Invoke-WebRequest -Method Options -Uri "https://rdjjskpfrubmrbjvybwt.supabase.co/functions/v1/create-pad" -Headers @{ "Origin"="http://localhost:5173"; "Access-Control-Request-Method"="POST"; "Access-Control-Request-Headers"="authorization, content-type" }
```
Create pad (minimal):
```
Invoke-WebRequest -Method Post -Uri "https://rdjjskpfrubmrbjvybwt.supabase.co/functions/v1/create-pad" -Headers @{ "Authorization"="Bearer <ANON_KEY>"; "Content-Type"="application/json" } -Body '{"items":[{"url":"https://example.com","title":"Example"}]}'
```

If you get `{ "short_id": "..." }`, backend is working.
