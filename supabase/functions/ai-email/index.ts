import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callXAI(model: string, system: string, user: string): Promise<string> {
  const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
  if (!XAI_API_KEY) throw new Error("XAI_API_KEY is not configured");

  const resp = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${XAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`xAI API error ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

const SPAM_PATTERNS = [
  "unsubscribe", "newsletter", "no-reply", "noreply", "do-not-reply",
  "donotreply", "mailing list", "opt out", "opt-out", "automatic reply",
  "auto-reply", "out of office",
];

function isSpamLocal(subject: string, from: string, body: string): boolean {
  const text = `${subject} ${from} ${body}`.toLowerCase();
  return SPAM_PATTERNS.some((kw) => text.includes(kw));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    // --- process: 4-stage pipeline, writes results back to DB ---
    if (action === "process") {
      const emails: Array<{ id: string; subject: string; from: string; preview: string; body?: string }> =
        body.emails ?? [];

      if (!emails.length) {
        return new Response(JSON.stringify({ results: {} }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // Stage 1: local spam filter (no LLM)
      const tagged = emails.map((e) => ({
        ...e,
        isSpam: isSpamLocal(e.subject, e.from, e.body || e.preview),
      }));
      const nonSpam = tagged.filter((e) => !e.isSpam);

      // Stage 2: batch classify all non-spam (single grok-3-mini-fast call)
      const classifications: Record<string, string> = {};
      if (nonSpam.length > 0) {
        const batch = nonSpam
          .map((e, i) => `[${i + 1}] Subject: ${e.subject}\nFrom: ${e.from}\nPreview: ${e.preview}`)
          .join("\n\n");

        const raw = await callXAI(
          "grok-3-mini-fast",
          `Classify each email into exactly one of: Sales, Support, Partnership, Vendor, Legal, Internal, Newsletter, Personal.
Return a JSON array: [{"index": 1, "classification": "Sales"}, ...]
Only return the JSON array, nothing else.`,
          batch,
        );

        try {
          const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              const e = nonSpam[item.index - 1];
              if (e) classifications[e.id] = item.classification;
            }
          }
        } catch {
          for (const e of nonSpam) classifications[e.id] = "Unknown";
        }
      }

      // Stage 3 + 4: score + summarize each non-spam email in parallel
      const results: Record<
        string,
        { score: number; summary: string; classification: string; isSpam: boolean }
      > = {};

      await Promise.all(
        tagged.map(async (e) => {
          if (e.isSpam) {
            results[e.id] = { score: 0, summary: "", classification: "Spam", isSpam: true };
            return;
          }

          const classification = classifications[e.id] || "Unknown";
          const emailText = `Subject: ${e.subject}\nFrom: ${e.from}\n\n${e.body || e.preview}`;

          const [scoreStr, summary] = await Promise.all([
            callXAI(
              "grok-3-fast",
              `Score this email 0-100 for business opportunity value. Classification: ${classification}.
100 = immediate revenue opportunity (buying signal, urgent deal, decision maker ready to act)
75 = strong potential (warm lead, interested partner, qualified prospect)
50 = worth tracking (exploratory, light interest, early stage)
25 = low value (cold outreach, generic inquiry)
0 = no value (newsletter, admin, out of office, spam)
Return only a number, nothing else.`,
              emailText,
            ),
            callXAI(
              "grok-3-fast",
              "Summarize this email in 1-2 sentences. Be direct and factual. No filler phrases.",
              emailText,
            ),
          ]);

          results[e.id] = {
            score: Math.min(100, Math.max(0, parseInt(scoreStr) || 0)),
            summary: summary.slice(0, 500),
            classification,
            isSpam: false,
          };
        }),
      );

      // Write results to DB (service role bypasses RLS)
      await Promise.all(
        Object.entries(results).map(([id, r]) =>
          supabase
            .from("emails")
            .update({
              opportunity_score: r.score,
              is_spam: r.isSpam,
              business_classification: r.classification,
              ai_summary: r.summary,
              ai_processed_at: new Date().toISOString(),
            })
            .eq("id", id)
        ),
      );

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- existing on-demand actions (Gemini → xAI) ---
    const { email, prompt } = body;
    let systemPrompt = "";
    let userContent = "";

    switch (action) {
      case "summarize":
        systemPrompt =
          "You are an email summarizer. Provide a concise 2-3 sentence summary of the email. Be direct and factual.";
        userContent = `Subject: ${email.subject}\nFrom: ${email.from}\n\n${email.body}`;
        break;

      case "smart_reply":
        systemPrompt =
          "You are an email assistant. Generate exactly 3 short, professional reply options for this email. Return them as a JSON array of strings. Each reply should be 1-2 sentences. Only return the JSON array, nothing else.";
        userContent = `Subject: ${email.subject}\nFrom: ${email.from}\n\n${email.body}`;
        break;

      case "compose_assist":
        systemPrompt =
          "You are a professional email writing assistant. Given the user's brief prompt, write a complete, polished email body. Be professional but natural. Only return the email body text, no subject line or greeting prefix.";
        userContent = prompt;
        break;

      case "categorize":
        systemPrompt = `You are an email categorization AI. Analyze each email and detect buying signals or contract-related language.

Look for words/phrases like: "proposal", "contract", "pricing", "quote", "budget", "purchase", "deal", "negotiate", "terms", "agreement", "sign", "buy", "invest", "cost", "RFP", "vendor", "procurement", "renewal", "subscription", "interested in purchasing", "move forward", "next steps", "timeline for delivery".

Return a JSON object with this structure:
{
  "results": [
    {
      "id": "email_id",
      "is_buying_signal": true/false,
      "urgency": "high" | "medium" | "low",
      "reason": "brief reason"
    }
  ]
}

Only return the JSON, nothing else.`;
        userContent = JSON.stringify(email);
        break;

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const content = await callXAI("grok-3-fast", systemPrompt, userContent);
    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
