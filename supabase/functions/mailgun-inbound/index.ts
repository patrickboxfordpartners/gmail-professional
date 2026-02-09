import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Verify Mailgun webhook signature using HMAC-SHA256. */
async function verifyMailgunSignature(
  signingKey: string,
  timestamp: string,
  token: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signingKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(timestamp + token);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

/** Parse "Name <email>" or plain "email" format. */
function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^["']|["']$/g, ""), email: match[2].trim().toLowerCase() };
  }
  return { name: "", email: raw.trim().toLowerCase() };
}

serve(async (req) => {
  // Mailgun sends inbound emails as multipart/form-data POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();

    // 1. Verify Mailgun webhook signature
    const signingKey = Deno.env.get("MAILGUN_WEBHOOK_SIGNING_KEY");
    if (!signingKey) {
      console.error("MAILGUN_WEBHOOK_SIGNING_KEY not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    const timestamp = formData.get("timestamp") as string;
    const token = formData.get("token") as string;
    const signature = formData.get("signature") as string;

    if (!timestamp || !token || !signature) {
      return new Response("Missing signature fields", { status: 400 });
    }

    const valid = await verifyMailgunSignature(
      signingKey,
      timestamp,
      token,
      signature
    );
    if (!valid) {
      console.warn("Invalid Mailgun signature — rejecting webhook");
      return new Response("Forbidden", { status: 403 });
    }

    // 2. Parse email fields from form data
    const fromRaw = (formData.get("from") as string) || "";
    const recipientRaw = (formData.get("recipient") as string) || "";
    const subject = (formData.get("subject") as string) || "(no subject)";
    const bodyHtml = (formData.get("body-html") as string) || "";
    const bodyPlain = (formData.get("body-plain") as string) || "";
    const messageId = (formData.get("Message-Id") as string) || null;

    const sender = parseEmailAddress(fromRaw);
    const recipient = parseEmailAddress(recipientRaw);

    if (!sender.email || !recipient.email) {
      console.warn("Missing sender or recipient, dropping email");
      // Return 200 so Mailgun doesn't retry
      return new Response("OK", { status: 200 });
    }

    const body = bodyHtml || bodyPlain;
    const preview = bodyPlain.replace(/\s+/g, " ").trim().slice(0, 100);

    // 3. Service client for DB operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Look up sender in profiles (set sender_id if internal)
    const { data: senderProfile } = await serviceClient
      .from("profiles")
      .select("id, email, display_name")
      .eq("email", sender.email)
      .maybeSingle();

    // 5. Look up recipient in profiles (must exist, otherwise drop)
    const { data: recipientProfile } = await serviceClient
      .from("profiles")
      .select("id, email, display_name")
      .eq("email", recipient.email)
      .maybeSingle();

    if (!recipientProfile) {
      console.warn(
        `Recipient ${recipient.email} not found in profiles — dropping email`
      );
      // Return 200 so Mailgun doesn't retry
      return new Response("OK", { status: 200 });
    }

    // 6. Insert email into DB
    const insertData: Record<string, unknown> = {
      sender_id: senderProfile?.id ?? null,
      sender_email: sender.email,
      sender_name: sender.name || senderProfile?.display_name || null,
      recipient_id: recipientProfile.id,
      recipient_email: recipientProfile.email,
      recipient_name: recipientProfile.display_name || null,
      subject,
      body,
      preview,
      folder: "inbox",
      read: false,
      starred: false,
      mailgun_message_id: messageId,
    };

    const { error: insertErr } = await serviceClient
      .from("emails")
      .insert(insertData);

    if (insertErr) {
      // Unique constraint on mailgun_message_id means duplicate — that's fine
      if (
        insertErr.code === "23505" &&
        insertErr.message?.includes("mailgun_message_id")
      ) {
        console.log("Duplicate inbound email (dedup by mailgun_message_id)");
        return new Response("OK", { status: 200 });
      }
      console.error("DB insert error:", insertErr);
      return new Response("Insert failed", { status: 500 });
    }

    console.log(
      `Inbound email from ${sender.email} to ${recipient.email} saved`
    );
    return new Response("OK", { status: 200 });
  } catch (e) {
    console.error("mailgun-inbound error:", e);
    return new Response("Internal error", { status: 500 });
  }
});
