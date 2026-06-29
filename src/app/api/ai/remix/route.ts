import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const dynamic = "force-dynamic";

// Rewrite a caption into a few distinct angles/tones.
export async function POST(req: NextRequest) {
  try {
    const { caption, platform = "instagram", niche } = await req.json();
    if (!caption) {
      return NextResponse.json({ error: "caption required" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You rewrite social media captions for ${platform}${
            niche ? ` (${niche})` : ""
          }. Keep the core message but change the angle/tone. Respond with strict JSON only.`,
        },
        {
          role: "user",
          content: `Rewrite this caption into 3 distinct variations — one punchy, one storytelling, one question-led:
"""${caption}"""

JSON: { "variations": ["...", "...", "..."] }`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content");
    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Remix error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Remix failed" },
      { status: 500 }
    );
  }
}
