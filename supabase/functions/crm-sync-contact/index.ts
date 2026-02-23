import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    const crmApiKey = Deno.env.get("CRM_API_KEY");
    const crmWorkspaceId = Deno.env.get("CRM_WORKSPACE_ID");

    if (!crmApiKey || !crmWorkspaceId) {
      return new Response(
        JSON.stringify({ error: "Missing CRM configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://crm.boxfordpartners.com/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": crmApiKey,
      },
      body: JSON.stringify({
        ...body,
        workspace_id: crmWorkspaceId,
      }),
    });

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: response.ok, ...result }),
      { status: response.ok ? 200 : response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
