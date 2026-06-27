import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Upload an example post image → GPT-4o Vision reverse-engineers the layout
// into editable zones + the content rules implied by the design.
export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl, name, postType } = await req.json();
    if (!imageDataUrl) {
      return NextResponse.json({ error: "imageDataUrl required" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a graphic-design analyst. You are shown ONE example social media post.
Reverse-engineer it into a reusable TEMPLATE: identify each visual zone (image areas,
text blocks, colored bars/overlays, logos) with their position and size as PERCENTAGES
of the canvas (0-100, origin top-left), plus the styling. Also infer the CONTENT RULES the
design implies (tone, how long the headline can be, hashtag count, etc).

Respond with STRICT JSON only, matching exactly this shape:
{
  "width": 1080,
  "height": 1080,
  "background": "#hex or null",
  "zones": [
    {
      "id": "short-id",
      "type": "image" | "text" | "shape" | "logo",
      "key": "image" | "headline" | "body" | "kicker" | "brand" | null,
      "x": 0, "y": 0, "w": 100, "h": 60,
      "fontSize": 64, "fontWeight": 800, "color": "#ffffff",
      "align": "left" | "center" | "right",
      "valign": "top" | "center" | "bottom",
      "uppercase": false, "lineHeight": 1.1,
      "fill": "#hex (shape only)", "opacity": 1, "radius": 0,
      "objectFit": "cover"
    }
  ],
  "rules": {
    "tone": "...",
    "headlineMaxWords": 12,
    "bodyMaxWords": 20,
    "hashtagCount": 8,
    "ctaStyle": "...",
    "doList": ["..."],
    "dontList": ["..."]
  }
}
Use "key" to mark zones that should be filled with fresh content each post:
the main photo = "image", the big title = "headline", supporting line = "body",
a small label = "kicker", the account/brand name = "brand". Static decorations
(quote marks, fixed taglines) use "text" with a literal "text" value and no key.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this ${postType ?? "social media"} post${
                name ? ` ("${name}")` : ""
              } and return the template JSON.`,
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from model");

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Template analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
