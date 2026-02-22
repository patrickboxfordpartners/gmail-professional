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
    console.log("=== mailgun-send function called ===");
    // 1. Authenticate caller via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Auth header present");

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
    const { to, subject, body, scheduledAt, cc, bcc, attachments } = await req.json();
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
    console.log("Looking up sender profile for user:", user.id);
    let { data: senderProfile, error: senderErr } = await serviceClient
      .from("profiles")
      .select("id, email, display_name")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create it
    if (senderErr || !senderProfile) {
      console.log("Profile not found, creating...", senderErr);
      const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
      const { data: newProfile, error: insertErr } = await serviceClient
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          display_name: displayName,
        })
        .select("id, email, display_name")
        .single();

      if (insertErr || !newProfile) {
        console.error("Failed to create profile:", insertErr);
        return new Response(
          JSON.stringify({ error: `Failed to create sender profile: ${insertErr?.message}` }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      senderProfile = newProfile;
    }
    console.log("Sender profile found:", senderProfile.email);

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
      folder: "sent",
      read: true,
      starred: false,
      cc: (cc as string[] | undefined)?.join(", ") || null,
      bcc: (bcc as string[] | undefined)?.join(", ") || null,
      attachments: (attachments as Array<{ name: string; size: number; type: string }> | undefined)
        ?.map((a) => ({ name: a.name, size: a.size, type: a.type })) ?? [],
    };

    if (scheduledAt) {
      insertData.scheduled_at = scheduledAt;
    }

    console.log("Inserting email into database...");
    const { data: emailRow, error: insertErr } = await serviceClient
      .from("emails")
      .insert(insertData)
      .select("id")
      .single();

    if (insertErr) {
      console.error("DB insert error:", insertErr);
      return new Response(
        JSON.stringify({ error: `Failed to save email: ${insertErr.message}` }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("Email saved to DB with ID:", emailRow.id);

    // 6. Send via Mailgun HTTP API
    const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
    const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN");

    console.log("Mailgun domain:", MAILGUN_DOMAIN);
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

    console.log("Sending via Mailgun to:", to);
    const form = new FormData();
    form.append("from", senderFrom);
    form.append("to", to);
    form.append("subject", subject || "(no subject)");
    form.append("html", body || "");

    // Scheduled delivery
    if (scheduledAt) {
      form.append("o:deliverytime", new Date(scheduledAt).toUTCString());
    }
    // Cc / Bcc
    if ((cc as string[] | undefined)?.length) {
      form.append("cc", (cc as string[]).join(", "));
    }
    if ((bcc as string[] | undefined)?.length) {
      form.append("bcc", (bcc as string[]).join(", "));
    }
    // Attachments — base64 decoded and appended as multipart
    for (const att of (attachments as Array<{ name: string; type: string; data: string }> | undefined) ?? []) {
      const binary = atob(att.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      form.append("attachment", new Blob([bytes], { type: att.type }), att.name);
    }

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
          error: `Email saved but delivery failed: ${errText}`,
          emailId: emailRow.id,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("Mailgun response OK");

    const mgData = await mgResponse.json();
    const mailgunMessageId = mgData.id || null;
    console.log("Mailgun message ID:", mailgunMessageId);

    // 7. Store mailgun_message_id on the email row
    if (mailgunMessageId) {
      await serviceClient
        .from("emails")
        .update({ mailgun_message_id: mailgunMessageId })
        .eq("id", emailRow.id);
    }

    console.log("=== Email sent successfully ===");
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
    console.error("=== mailgun-send error ===", e);
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
