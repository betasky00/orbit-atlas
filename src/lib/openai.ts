import OpenAI from "openai";

// Lazily instantiate so the build never requires the key —
// it's only needed at runtime when a request actually hits the API.
let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to your environment variables."
      );
    }
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

export interface AIPostSuggestion {
  caption: string;
  hashtags: string[];
  firstComment: string;
  bestTimes: string[];
}

export async function generatePostContent(params: {
  businessName: string;
  niche: string;
  platform: string;
  mediaDescription?: string;
  tone?: string;
}): Promise<AIPostSuggestion> {
  const { businessName, niche, platform, mediaDescription, tone = "engaging" } = params;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a social media expert specializing in ${niche} content for ${platform}.
Create compelling, platform-optimized content that drives engagement.
Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Create a ${platform} post for ${businessName}, a ${niche} business.
${mediaDescription ? `The post is about: ${mediaDescription}` : ""}
Tone: ${tone}

Respond with JSON:
{
  "caption": "post caption (no hashtags here)",
  "hashtags": ["hashtag1", "hashtag2", ...up to 15 relevant hashtags without #],
  "firstComment": "engaging first comment to boost reach",
  "bestTimes": ["Monday 9am", "Wednesday 6pm", "Friday 12pm"]
}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content from OpenAI");

  return JSON.parse(content);
}

export async function generateBio(params: {
  businessName: string;
  niche: string;
  platform: string;
  keyPoints?: string;
}): Promise<{ bio: string; alternatives: string[] }> {
  const { businessName, niche, platform, keyPoints } = params;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a social media bio specialist. Create compelling bios optimized for ${platform}.
Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Write a ${platform} bio for ${businessName}, a ${niche} business.
${keyPoints ? `Key points to include: ${keyPoints}` : ""}
Character limits: Instagram 150, Facebook 255, TikTok 80.

Respond with JSON:
{
  "bio": "primary bio option",
  "alternatives": ["alternative 1", "alternative 2"]
}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content from OpenAI");

  return JSON.parse(content);
}

export async function getBestPostingTimes(params: {
  niche: string;
  platform: string;
  timezone?: string;
}): Promise<{ times: Array<{ day: string; time: string; reason: string }> }> {
  const { niche, platform, timezone = "Europe/Paris" } = params;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a social media analytics expert. Provide data-driven posting time recommendations.
Always respond with valid JSON only.`,
      },
      {
        role: "user",
        content: `Best times to post on ${platform} for a ${niche} business in ${timezone} timezone.

Respond with JSON:
{
  "times": [
    {"day": "Monday", "time": "9:00 AM", "reason": "why this time works"},
    ...provide 7 optimal time slots
  ]
}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error("No content from OpenAI");

  return JSON.parse(content);
}

