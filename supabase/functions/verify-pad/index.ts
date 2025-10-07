// supabase/functions/verify-pad/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...corsHeaders } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  const { short_id, password } = await req.json();
  if (!short_id || !password) return json({ error: "Missing fields" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: pad } = await admin.from("pads").select("*").eq("short_id", short_id).maybeSingle();
  if (!pad) return json({ valid: false }, 200);

  const ok = pad.password_hash ? await bcrypt.compare(password, pad.password_hash) : false;
  if (!ok) return json({ valid: false }, 200);

  const { data: items } = await admin.from("items").select("*").eq("pad_id", pad.id).order("position");
  return json({ valid: true, pad: { ...pad, items: items || [] } }, 200);
});