// supabase/functions/create-pad/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  try {
    const { items, title, description, password, expires_at, monetize } = await req.json();
    if (!Array.isArray(items) || items.length === 0) return json({ error: "No items provided" }, 400);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const gen = () => Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

    let short_id = gen();
    for (let i = 0; i < 3; i++) {
      const { data: exists, error: existsErr } = await admin
        .from("pads").select("id").eq("short_id", short_id).maybeSingle();
      if (existsErr) return json({ error: "DB error checking id" }, 500);
      if (!exists) break;
      short_id = gen();
    }

    let password_hash: string | null = null;
    if (password && String(password).length > 0) password_hash = await bcrypt.hash(password);

    const { data: pad, error: padErr } = await admin
      .from("pads")
      .insert({
        short_id,
        title: title || null,
        description: description || null,
        password_hash,
        monetize: monetize !== false,
        ad_variant: "A",
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (padErr || !pad) return json({ error: "Failed to insert pad" }, 500);

    const toInsert = items.map((it: any, idx: number) => ({
      pad_id: pad.id,
      url: it.url,
      title: it.title || null,
      position: idx,
    }));
    const { error: itemsErr } = await admin.from("items").insert(toInsert);
    if (itemsErr) return json({ error: "Failed to insert items" }, 500);

    return json({ short_id }, 200);
  } catch (e) {
    return json({ error: e?.message || "Unexpected error" }, 500);
  }
});
