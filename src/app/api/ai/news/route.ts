import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import type { TemplateRules } from "@/lib/templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface NewsBody {
  topic: string; // pasted headline, article, or topic
  businessName?: string;
  niche?: string;
  platform?: string;
  brandVoice?: string;
  rules?: TemplateRules;
}

// Turn a raw news item / topic into ready-to-post content that obeys the
// selected template's rules. Returns everything needed to fill the template
// AND publish — including an image prompt for AI image generation.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as NewsBody;
    const { topic, businessName, niche, platform = "instagram", brandVoice, rules } = body;

    if (!topic) {
      return NextResponse.json({ error: "topic required" }, { status: 400 });
    }

    const rulesText = rules
      ? `Template content rules (follow EXACTLY):
- Tone: ${rules.tone ?? "on-brand"}
- Headline: max ${rules.headlineMaxWords ?? 12} words
- Body line: max ${rules.bodyMaxWords ?? 18} words
- Hashtags: exactly ${rules.hashtagCount ?? 8}
- CTA style: ${rules.ctaStyle ?? "subtle"}
${rules.doList?.length ? `- Do: ${rules.doList.join("; ")}` : ""}
${rules.dontList?.length ? `- Don't: ${rules.dontList.join("; ")}` : ""}
${rules.extra ?? ""}`
      : "No special template rules.";

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are the social media manager for ${
            businessName ?? "a brand"
          }${niche ? ` (a ${niche} business)` : ""}.
${brandVoice ? `Brand voice: ${brandVoice}.` : ""}
You convert a news item or topic into a finished ${platform} post that drops into a
visual template with zero manual editing. Be accurate, never invent facts not in the
source. Respond with STRICT JSON only.`,
        },
        {
          role: "user",
          content: `SOURCE:
"""
${topic}
"""

${rulesText}

Produce the post as JSON:
{
  "kicker": "tiny uppercase label, e.g. BREAKING / NEWS / UPDATE",
  "headline": "the on-image headline (obey max words)",
  "body": "optional supporting line for the image (obey max words)",
  "brand": "${businessName ?? ""}",
  "caption": "the full caption for the post text (engaging, no hashtags here)",
  "hashtags": ["tag", "..."],
  "firstComment": "first comment to boost reach",
  "imagePrompt": "a vivid prompt to generate a fitting background image (photographic, no text, no words in the image)"
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from model");

    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("News generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
