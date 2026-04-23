// Public endpoint: GET token info, POST to authorize mandate. No auth required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token") ?? (req.method === "POST" ? (await req.clone().json().catch(() => ({}))).token : null);
    if (!token) return new Response(JSON.stringify({ error: "Token required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: row } = await admin.from("mandate_authorization_tokens").select("*, businesses(name)").eq("token", token).maybeSingle();
    if (!row) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (new Date(row.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Token expired" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "GET") {
      return new Response(JSON.stringify({
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        business_name: (row as any).businesses?.name ?? "Business",
        scheme: row.scheme,
        status: row.status,
        expires_at: row.expires_at,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // POST = authorize
    if (row.status !== "pending") {
      return new Response(JSON.stringify({ error: "Token already used", status: row.status }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { iban, account_holder_name } = body;
    if (!iban || !account_holder_name) {
      return new Response(JSON.stringify({ error: "iban and account_holder_name required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Find or create customer
    let customerId = row.customer_id;
    if (!customerId) {
      const { data: existing } = await admin.from("customers").select("id").eq("business_id", row.business_id).eq("email", row.customer_email).maybeSingle();
      if (existing) {
        customerId = existing.id;
        await admin.from("customers").update({ iban }).eq("id", customerId);
      } else {
        const { data: newCust, error: cErr } = await admin.from("customers").insert({
          business_id: row.business_id,
          name: row.customer_name,
          email: row.customer_email,
          iban,
        }).select().single();
        if (cErr) throw cErr;
        customerId = newCust.id;
      }
    } else {
      await admin.from("customers").update({ iban }).eq("id", customerId);
    }

    // Create mandate (pending — real GoCardless creation happens via existing flow / webhook confirmation)
    const { data: mandate, error: mErr } = await admin.from("mandates").insert({
      business_id: row.business_id,
      customer_id: customerId,
      status: "pending_submission",
    }).select().single();
    if (mErr) throw mErr;

    await admin.from("mandate_authorization_tokens").update({
      status: "authorized",
      mandate_id: mandate.id,
      customer_id: customerId,
      used_at: new Date().toISOString(),
    }).eq("id", row.id);

    await admin.from("audit_log").insert({
      action: "mandate.authorized_via_link",
      resource_type: "mandate",
      resource_id: mandate.id,
      business_id: row.business_id,
      metadata: { token: row.token, customer_email: row.customer_email, account_holder_name },
    });

    return new Response(JSON.stringify({ success: true, mandate_id: mandate.id }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
