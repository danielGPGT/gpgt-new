import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function is public: no authentication required
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let consultantEmail: string | undefined;
  let formData: any;
  try {
    const body = await req.json();
    consultantEmail = body.consultantEmail;
    formData = body.formData;
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  if (!consultantEmail || !formData) {
    return new Response("Missing data", { status: 400, headers: corsHeaders });
  }

  const emailBody = `New package request submitted:\n\n${JSON.stringify(formData, null, 2)}`;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "noreply@yourdomain.com",
      to: consultantEmail,
      subject: "New Package Request",
      text: emailBody,
    }),
  });

  if (response.ok) {
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } else {
    const error = await response.text();
    return new Response(JSON.stringify({ error }), { status: 500, headers: corsHeaders });
  }
}); 