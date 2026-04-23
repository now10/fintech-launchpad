// Generate a public mandate authorization link for a customer (no account required)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { customer_email, customer_name, scheme, customer_id } = body;
    if (!customer_email || !customer_name) {
      return new Response(JSON.stringify({ error: "customer_email and customer_name required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: business } = await admin.from("businesses").select("id, name").eq("owner_id", user.id).single();
    if (!business) return new Response(JSON.stringify({ error: "No business" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Generate cryptographically secure token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

    const { data: tokenRow, error } = await admin.from("mandate_authorization_tokens").insert({
      token,
      business_id: business.id,
      customer_id: customer_id ?? null,
      customer_email,
      customer_name,
      scheme: scheme ?? "sepa_core",
    }).select().single();

    if (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("audit_log").insert({
      actor_id: user.id,
      actor_email: user.email,
      action: "mandate_link.created",
      resource_type: "mandate_authorization_token",
      resource_id: tokenRow.id,
      business_id: business.id,
      metadata: { customer_email, scheme },
    });

    const origin = req.headers.get("origin") ?? "";
    return new Response(JSON.stringify({
      success: true,
      token,
      url: `${origin}/pay/${token}`,
      expires_at: tokenRow.expires_at,
      business_name: business.name,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
