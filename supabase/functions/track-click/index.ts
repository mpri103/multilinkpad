// supabase/functions/track-click/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...corsHeaders } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const { item_id, ip_hash, user_agent } = await req.json();
  if (!item_id) return json({ error: "Missing item_id" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { error: insErr } = await admin.from("clicks").insert({ item_id, ip_hash: ip_hash || null, user_agent: user_agent || null });
  if (insErr) return json({ error: "Click insert failed" }, 500);

  // Increment clicks via RPC (recommended). Create the function in SQL Editor:
  // create or replace function public.increment_item_clicks(p_item_id uuid)
  // returns void as $$ update public.items set clicks = clicks + 1 where id = p_item_id; $$ language sql security definer;
  // grant execute on function public.increment_item_clicks(uuid) to authenticated, anon;
  try {
    const { error: rpcErr } = await admin.rpc("increment_item_clicks", { p_item_id: item_id });
    if (rpcErr) throw rpcErr;
  } catch (e) {
    // Fallback: not ideal, but avoid failing the request
  }
  return json({ success: true }, 200);
});
