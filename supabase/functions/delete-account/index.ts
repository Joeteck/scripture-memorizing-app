// supabase/functions/delete-account/index.ts
//
// Deletes the calling user's own account. This has to run server-side:
// deleting an auth user requires the service_role key, and that key must
// never be bundled into the mobile app. The app instead calls this
// function (see deleteAccount() in src/lib/auth.ts), which:
//
//   1. Reads the caller's own access token from the Authorization header
//      (supabase-js's functions.invoke() attaches this automatically).
//   2. Verifies that token against Supabase Auth to get the real user id
//      — never trusts a user id passed in the request body, since that
//      would let anyone delete anyone else's account.
//   3. Uses the service_role key to delete exactly that user.
//
// Deleting the auth user cascades to `verses`, `categories`, and
// `profiles` (all declared `on delete cascade` in supabase/schema.sql).
// `feedback` and `error_logs` rows are kept but anonymized (`on delete
// set null`) since they're useful for debugging independent of who
// filed them.
//
// One-time setup (see PRODUCTION_AUDIT_REPORT.md for the full walkthrough):
//   supabase functions deploy delete-account
//
// No manual secrets needed — SUPABASE_URL, SUPABASE_ANON_KEY, and
// SUPABASE_SERVICE_ROLE_KEY are injected automatically into every Edge
// Function by Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client scoped to the caller's own token — used only to verify who
    // they are, never to perform the deletion itself.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Could not verify caller identity." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client, service_role key — this is the only client allowed
    // to actually delete a user, and it only ever deletes the verified
    // caller's own id above.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
