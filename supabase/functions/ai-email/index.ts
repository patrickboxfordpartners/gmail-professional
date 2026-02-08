import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not configured");

    const { action, email, prompt } = await req.json();

    let systemPrompt = "";
    let userContent = "";

    switch (action) {
      case "summarize":
        systemPrompt = "You are an email summarizer. Provide a concise 2-3 sentence summary of the email. Be direct and factual.";
        userContent = `Subject: ${email.subject}\nFrom: ${email.from}\n\n${email.body}`;
        break;

      case "smart_reply":
        systemPrompt = "You are an email assistant. Generate exactly 3 short, professional reply options for this email. Return them as a JSON array of strings. Each reply should be 1-2 sentences. Only return the JSON array, nothing else.";
        userContent = `Subject: ${email.subject}\nFrom: ${email.from}\n\n${email.body}`;
        break;

      case "compose_assist":
        systemPrompt = "You are a professional email writing assistant. Given the user's brief prompt, write a complete, polished email body. Be professional but natural. Only return the email body text, no subject line or greeting prefix.";
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

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GOOGLE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI API error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-email error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
