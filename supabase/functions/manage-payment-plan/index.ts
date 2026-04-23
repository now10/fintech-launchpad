// Create / update / cancel a recurring payment plan (subscription)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function nextDate(start: string, frequency: string): string {
  const d = new Date(start);
  switch (frequency) {
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: business } = await admin.from("businesses").select("id").eq("owner_id", user.id).single();
    if (!business) return new Response(JSON.stringify({ error: "No business" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { action, plan_id } = body;

    if (action === "cancel" && plan_id) {
      await admin.from("payment_plans").update({ status: "cancelled" }).eq("id", plan_id).eq("business_id", business.id);
      await admin.from("audit_log").insert({
        actor_id: user.id, actor_email: user.email,
        action: "payment_plan.cancelled", resource_type: "payment_plan", resource_id: plan_id, business_id: business.id,
      });
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create") {
      const { customer_id, mandate_id, amount, currency, frequency, start_date, end_date } = body;
      if (!customer_id || !amount || !frequency) {
        return new Response(JSON.stringify({ error: "customer_id, amount, frequency required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const start = start_date ?? new Date().toISOString().slice(0, 10);
      const { data: plan, error } = await admin.from("payment_plans").insert({
        business_id: business.id,
        customer_id,
        mandate_id: mandate_id ?? null,
        amount: Number(amount),
        currency: currency ?? "EUR",
        frequency,
        start_date: start,
        end_date: end_date ?? null,
        next_payment_date: nextDate(start, frequency),
        status: "active",
      }).select().single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await admin.from("audit_log").insert({
        actor_id: user.id, actor_email: user.email,
        action: "payment_plan.created", resource_type: "payment_plan", resource_id: plan.id, business_id: business.id,
        metadata: { amount, frequency, customer_id },
      });
      return new Response(JSON.stringify({ success: true, plan }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
