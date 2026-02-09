import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // 1. Authenticate caller via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // User client to verify the JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client for DB operations (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Parse request body
    const { to, subject, body, scheduledAt } = await req.json();
    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Look up sender's profile
    const { data: senderProfile, error: senderErr } = await serviceClient
      .from("profiles")
      .select("id, email, display_name")
      .eq("id", user.id)
      .single();

    if (senderErr || !senderProfile) {
      return new Response(
        JSON.stringify({ error: "Sender profile not found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. Check if recipient is internal (has a profile)
    const { data: recipientProfile } = await serviceClient
      .from("profiles")
      .select("id, email, display_name")
      .eq("email", to)
      .maybeSingle();

    const preview = (body || "").replace(/<[^>]*>/g, "").slice(0, 100);

    const senderName =
      senderProfile.display_name || senderProfile.email.split("@")[0];
    const senderFrom = `${senderName} <${senderProfile.email}>`;

    // 5. Insert email into DB
    const insertData: Record<string, unknown> = {
      sender_id: user.id,
      sender_email: senderProfile.email,
      sender_name: senderName,
      recipient_email: to,
      recipient_id: recipientProfile?.id ?? null,
      recipient_name: recipientProfile?.display_name ?? null,
      subject: subject || "",
      body: body || "",
      preview,
      folder: "inbox",
      read: false,
      starred: false,
    };

    if (scheduledAt) {
      insertData.scheduled_at = scheduledAt;
    }

    const { data: emailRow, error: insertErr } = await serviceClient
      .from("emails")
      .insert(insertData)
      .select("id")
      .single();

    if (insertErr) {
      console.error("DB insert error:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to save email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 6. Send via Mailgun HTTP API
    const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
    const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN");

    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error("Mailgun env vars not configured");
      return new Response(
        JSON.stringify({
          error: "Email delivery not configured",
          emailId: emailRow.id,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const form = new FormData();
    form.append("from", senderFrom);
    form.append("to", to);
    form.append("subject", subject || "(no subject)");
    form.append("html", body || "");

    const mgResponse = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: form,
      }
    );

    if (!mgResponse.ok) {
      const errText = await mgResponse.text();
      console.error("Mailgun send error:", mgResponse.status, errText);
      // Email is saved in DB even if delivery fails
      return new Response(
        JSON.stringify({
          error: "Email saved but delivery failed",
          emailId: emailRow.id,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mgData = await mgResponse.json();
    const mailgunMessageId = mgData.id || null;

    // 7. Store mailgun_message_id on the email row
    if (mailgunMessageId) {
      await serviceClient
        .from("emails")
        .update({ mailgun_message_id: mailgunMessageId })
        .eq("id", emailRow.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailRow.id,
        mailgunMessageId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("mailgun-send error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
