// supabase/functions/revenuecat-webhook/index.ts
//
// RevenueCat calls this URL whenever a subscription event happens for
// any user — initial purchase, renewal, cancellation, billing issue,
// expiration, etc. This keeps `profiles.subscription_tier` /
// `subscription_status` (supabase/schema.sql) in sync so the backend
// (and useSubscription's fallback path — see src/hooks/useSubscription.ts)
// has a server-side record independent of any single device's on-hand
// RevenueCat SDK state.
//
// The app itself does NOT rely on this table as the primary gate —
// src/lib/purchases.ts checks RevenueCat's on-device CustomerInfo first,
// since that's real-time. This table is the fallback/backend record.
//
// SECURITY: RevenueCat signs webhook requests with a bearer token you
// configure in its dashboard (Project Settings > Webhooks > Authorization
// header). This function rejects any request whose Authorization header
// doesn't match REVENUECAT_WEBHOOK_SECRET — without that check, anyone
// who found this URL could grant themselves (or anyone) a free
// subscription by POSTing a fake event.
//
// One-time setup:
//   supabase functions deploy revenuecat-webhook --no-verify-jwt
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<a long random string>
// Then in the RevenueCat dashboard: Project Settings > Integrations >
// Webhooks — set the URL to this function's endpoint and the
// Authorization header value to the same secret.
//
// `--no-verify-jwt` is required because RevenueCat can't send a Supabase
// user JWT (it doesn't have one) — this function does its own auth via
// the shared secret above instead of Supabase's built-in JWT check.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RevenueCat's product identifiers, mapped to this app's tier names.
// Update these to match whatever product ids are actually configured in
// App Store Connect / Play Console + RevenueCat — these are placeholders.
function mapProductToTier(productId: string): "backup_monthly" | "backup_annual" | "free" {
  if (productId.includes("annual") || productId.includes("yearly")) return "backup_annual";
  if (productId.includes("monthly")) return "backup_monthly";
  return "free";
}

// RevenueCat event types that mean "this user should currently be
// considered subscribed." Everything else (CANCELLATION only marks
// auto-renew off, not immediate loss of access; EXPIRATION is the one
// that actually ends access) is handled explicitly below.
const ACTIVE_EVENT_TYPES = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const expectedSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    const authHeader = req.headers.get("Authorization");

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const event = body?.event;

    if (!event) {
      return new Response(JSON.stringify({ error: "Missing event payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // app_user_id is the Supabase user id — see initPurchases() in
    // src/lib/purchases.ts, which configures RevenueCat with exactly
    // that id, so the two systems always agree on identity without a
    // separate mapping table.
    const userId: string | undefined = event.app_user_id;
    const eventType: string = event.type;
    const productId: string = event.product_id ?? "";

    if (!userId) {
      // Anonymous/pre-login RevenueCat events aren't linkable to a
      // profile — acknowledge and skip rather than error, since
      // RevenueCat will retry on non-2xx responses.
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const isExpiredOrBillingIssue =
      eventType === "EXPIRATION" || eventType === "BILLING_ISSUE";
    const isCancellation = eventType === "CANCELLATION";

    let tier: "free" | "backup_monthly" | "backup_annual" = "free";
    let status: "active" | "canceled" | "past_due" | "none" = "none";

    if (ACTIVE_EVENT_TYPES.has(eventType)) {
      tier = mapProductToTier(productId);
      status = "active";
    } else if (isCancellation) {
      // Auto-renew turned off, but access continues until the current
      // period actually ends (EXPIRATION handles that transition) — so
      // the tier stays, only the status reflects the pending cancellation.
      tier = mapProductToTier(productId);
      status = "canceled";
    } else if (eventType === "BILLING_ISSUE") {
      tier = mapProductToTier(productId);
      status = "past_due";
    } else if (eventType === "EXPIRATION") {
      tier = "free";
      status = "none";
    }
    // Any other event type (TRANSFER, SUBSCRIPTION_PAUSED, TEST, etc.)
    // falls through without an update — logged for visibility, not
    // treated as an error.

    if (ACTIVE_EVENT_TYPES.has(eventType) || isCancellation || isExpiredOrBillingIssue) {
      const { error } = await adminClient
        .from("profiles")
        .update({ subscription_tier: tier, subscription_status: status })
        .eq("id", userId);

      if (error) {
        console.error("Failed to update profile from RevenueCat webhook", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, eventType }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("revenuecat-webhook error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
