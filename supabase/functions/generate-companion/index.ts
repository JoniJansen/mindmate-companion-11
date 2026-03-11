import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MASTER_STYLE = `Create a high-quality illustrated companion portrait.
STYLE: semi-realistic animated character, Disney-inspired character design, anime-influenced facial features, soft cinematic lighting, subtle warm color palette, professional character illustration, clean soft background, upper-torso portrait.
MOOD: calm, intelligent, kind, trustworthy, thoughtful.
DO NOT include: text, logos, busy background, exaggerated anime style, chibi proportions, watermarks.
Portrait must feel premium and emotionally expressive.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let userId: string;
    try {
      const { user } = await requireUser(req);
      userId = user.id;
    } catch (authError) {
      if (authError instanceof Response) return authError;
      throw authError;
    }

    const { appearance_prompt } = await req.json();
    if (!appearance_prompt || typeof appearance_prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "appearance_prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Generate portrait via Gemini image model
    const prompt = `${MASTER_STYLE}\n\nCHARACTER DESCRIPTION: ${appearance_prompt}`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error("Image generation failed:", imageResponse.status, errorText);
      if (imageResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to generate avatar" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 and upload to Supabase Storage
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const fileName = `${userId}/companion-${Date.now()}.png`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { error: uploadError } = await adminClient.storage
      .from("avatars")
      .upload(fileName, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to save avatar" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update companion profile with avatar URL
    const { error: updateError } = await adminClient
      .from("companion_profiles")
      .update({ avatar_url: fileName })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update failed:", updateError);
    }

    return new Response(
      JSON.stringify({ avatar_path: fileName, success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate companion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
