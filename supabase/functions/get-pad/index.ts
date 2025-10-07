// supabase/functions/get-pad/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...corsHeaders } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method Not Allowed" }, 405);

  const url = new URL(req.url);
  const shortId = url.searchParams.get("id");
  if (!shortId) return json({ error: "Missing id" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: pad, error: padErr } = await admin.from("pads").select("*").eq("short_id", shortId).maybeSingle();
  if (padErr) return json({ error: "DB error" }, 500);
  if (!pad) return json({ error: "Not found" }, 404);

  if (pad.expires_at && new Date(pad.expires_at) < new Date()) {
    return json({ error: "Pad expired" }, 410);
  }

  if (pad.password_hash) {
    return json({ is_protected: true, title: pad.title ?? "" }, 200);
  }

  const { data: items, error: itemsErr } = await admin.from("items").select("*").eq("pad_id", pad.id).order("position");
  if (itemsErr) return json({ error: "Items error" }, 500);

  return json({ ...pad, items }, 200);
});