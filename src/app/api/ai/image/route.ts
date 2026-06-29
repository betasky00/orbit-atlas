import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Generate an image with OpenAI's image model. Returns a data URL that can be
// dropped straight into a template zone (and later composited + uploaded).
export async function POST(req: NextRequest) {
  try {
    const { prompt, size = "1024x1024", quality = "low" } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    // quality "low" keeps gpt-image-1 cost down (~1¢/image vs several ¢ on high).
    const result = await getOpenAI().images.generate({
      model: "gpt-image-1",
      prompt,
      size,
      quality,
      n: 1,
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) {
      // some models / configs return a URL instead
      const url = result.data?.[0]?.url;
      if (url) return NextResponse.json({ dataUrl: url });
      throw new Error("No image returned");
    }

    return NextResponse.json({ dataUrl: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 }
    );
  }
}
