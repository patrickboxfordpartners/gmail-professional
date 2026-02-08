import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const contentType = req.headers.get("content-type") || "";

    // Handle JSON body for IMAP import
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.action === "imap_import") {
        return await handleImapImport(supabase, user.id, body);
      }
      throw new Error("Unknown action");
    }

    // Handle multipart file uploads
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const fileType = formData.get("type") as string; // "eml", "mbox", "csv"

      if (!file) throw new Error("No file provided");

      const text = await file.text();
      let imported = 0;

      switch (fileType) {
        case "eml":
          imported = await importEml(supabase, user.id, text);
          break;
        case "mbox":
          imported = await importMbox(supabase, user.id, text);
          break;
        case "csv":
          imported = await importCsv(supabase, user.id, text);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      return new Response(
        JSON.stringify({ success: true, imported }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Unsupported content type");
  } catch (e) {
    console.error("email-migration error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ─── EML Parser ───────────────────────────────────────────
function parseEml(raw: string): { from: string; subject: string; date: string; body: string } {
  const headerEnd = raw.indexOf("\r\n\r\n") !== -1 ? raw.indexOf("\r\n\r\n") : raw.indexOf("\n\n");
  const headerBlock = raw.slice(0, headerEnd);
  const bodyRaw = raw.slice(headerEnd).trim();

  const getHeader = (name: string): string => {
    const regex = new RegExp(`^${name}:\\s*(.+)`, "im");
    const match = headerBlock.match(regex);
    return match ? match[1].trim() : "";
  };

  const from = getHeader("From").replace(/.*<(.+)>.*/, "$1") || getHeader("From");
  const subject = getHeader("Subject") || "(no subject)";
  const date = getHeader("Date") || new Date().toISOString();

  // Strip MIME boundaries for simplicity, take text content
  let body = bodyRaw;
  if (body.includes("Content-Type:")) {
    // Try to extract plain text part
    const textMatch = body.match(/Content-Type:\s*text\/plain[^]*?\n\n([^]*?)(?=--|\z)/i);
    if (textMatch) body = textMatch[1].trim();
    else {
      const htmlMatch = body.match(/Content-Type:\s*text\/html[^]*?\n\n([^]*?)(?=--|\z)/i);
      if (htmlMatch) body = htmlMatch[1].trim();
    }
  }

  return { from, subject, date, body };
}

async function importEml(supabase: any, userId: string, text: string): Promise<number> {
  const parsed = parseEml(text);
  await insertEmail(supabase, userId, parsed);
  return 1;
}

// ─── MBOX Parser ──────────────────────────────────────────
async function importMbox(supabase: any, userId: string, text: string): Promise<number> {
  // Split by "From " at start of line (mbox format)
  const messages = text.split(/^From /m).filter((m) => m.trim().length > 0);
  const parsed: { from: string; subject: string; body: string; date: string }[] = [];

  for (const msg of messages) {
    try {
      const lines = msg.split("\n");
      const emlContent = lines.slice(1).join("\n");
      parsed.push(parseEml(emlContent));
    } catch (e) {
      console.error("Failed to parse mbox message:", e);
    }
  }

  return await batchInsertEmails(supabase, userId, parsed);
}

// ─── CSV Parser ───────────────────────────────────────────
async function importCsv(supabase: any, userId: string, text: string): Promise<number> {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row");

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const fromIdx = header.findIndex((h) => h === "from" || h === "sender" || h === "from_email");
  const subjectIdx = header.findIndex((h) => h === "subject");
  const bodyIdx = header.findIndex((h) => h === "body" || h === "content" || h === "message");
  const dateIdx = header.findIndex((h) => h === "date" || h === "sent_at" || h === "timestamp");

  if (subjectIdx === -1) throw new Error("CSV must have a 'subject' column");

  const parsed: { from: string; subject: string; body: string; date: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const cols = parseCsvLine(lines[i]);
      parsed.push({
        from: fromIdx >= 0 ? cols[fromIdx] || "unknown@import.local" : "unknown@import.local",
        subject: cols[subjectIdx] || "(no subject)",
        body: bodyIdx >= 0 ? cols[bodyIdx] || "" : "",
        date: dateIdx >= 0 ? cols[dateIdx] || new Date().toISOString() : new Date().toISOString(),
      });
    } catch (e) {
      console.error(`Failed to parse CSV row ${i}:`, e);
    }
  }

  return await batchInsertEmails(supabase, userId, parsed);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

// ─── IMAP Import ──────────────────────────────────────────
async function handleImapImport(supabase: any, userId: string, config: any) {
  // Note: Deno doesn't have native IMAP support, so we simulate with a fetch-based approach
  // For production, you'd use a Deno IMAP library or proxy
  const { host, port, username, password, folder, limit } = config;

  if (!host || !username || !password) {
    throw new Error("Missing IMAP configuration (host, username, password)");
  }

  // Since Deno edge functions can't do raw TCP/IMAP, we return instructions
  // In a real implementation, this would use a worker or external service
  return new Response(
    JSON.stringify({
      error: "IMAP direct connection is not supported in serverless edge functions. Please export your emails as .mbox or .eml files from your email client and use the file import option instead.",
      suggestion: "Most email clients (Gmail, Outlook, Thunderbird) support exporting to .mbox format via Settings > Export or via Google Takeout.",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── Insert Email Helper ──────────────────────────────────
function buildEmailRow(userId: string, data: { from: string; subject: string; body: string; date: string }) {
  const preview = data.body.replace(/<[^>]*>/g, "").slice(0, 200);
  const htmlBody = data.body.includes("<") ? data.body : `<p>${data.body.replace(/\n/g, "</p><p>")}</p>`;
  return {
    sender_id: userId,
    recipient_id: userId,
    subject: data.subject,
    preview,
    body: htmlBody,
    folder: "inbox",
    read: true,
    created_at: data.date || new Date().toISOString(),
  };
}

async function insertEmail(
  supabase: any,
  userId: string,
  data: { from: string; subject: string; body: string; date: string }
) {
  const row = buildEmailRow(userId, data);
  const { error } = await supabase.from("emails").insert(row);
  if (error) {
    console.error("Insert email error:", error);
    throw new Error(`Failed to insert email: ${error.message}`);
  }
}

const BATCH_SIZE = 50;

async function batchInsertEmails(
  supabase: any,
  userId: string,
  items: { from: string; subject: string; body: string; date: string }[]
): Promise<number> {
  let count = 0;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE).map((d) => buildEmailRow(userId, d));
    const { error } = await supabase.from("emails").insert(batch);
    if (error) {
      console.error(`Batch insert error at offset ${i}:`, error);
    } else {
      count += batch.length;
    }
  }
  return count;
}
