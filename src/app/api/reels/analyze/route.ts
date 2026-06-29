import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Shot {
  index: number;
  time: number;
  duration: number;
  dataUrl: string; // representative frame
}

interface AnalyzeBody {
  shots: Shot[];
  totalDuration: number;
  aspectRatio?: string;
  sourceName?: string;
}

// The cuts are detected client-side (frame differencing). Here the AI just
// DESCRIBES each detected shot + overall vibe, so the user knows what to film
// for each slot. One representative frame per shot keeps cost low.
export async function POST(req: NextRequest) {
  try {
    const { shots, totalDuration, aspectRatio = "9:16", sourceName } =
      (await req.json()) as AnalyzeBody;

    if (!shots?.length) {
      return NextResponse.json({ error: "shots required" }, { status: 400 });
    }

    // Cap how many frames we send to bound tokens; sample evenly if needed.
    const MAX = 24;
    const sample =
      shots.length <= MAX
        ? shots
        : shots.filter((_, i) => i % Math.ceil(shots.length / MAX) === 0).slice(0, MAX);

    const imageParts = sample.map((s) => ({
      type: "image_url" as const,
      image_url: { url: s.dataUrl, detail: "low" as const },
    }));

    const shotList = sample
      .map((s) => `Shot ${s.index} @ ${s.time.toFixed(2)}s (${s.duration.toFixed(2)}s long)`)
      .join("; ");

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a short-form video editor. The cut points of a ${totalDuration.toFixed(
            1
          )}s vertical reel have already been detected precisely. You are given one frame per
shot, in order (${shotList}). Describe each shot so the user can recreate it with their own
footage, and give overall guidance. Respond with STRICT JSON only:
{
  "shots": [
    { "index": 0, "description": "what to film / what's shown", "onScreenText": "text on screen or null" }
  ],
  "musicVibe": "inferred music mood/energy (estimate)",
  "pacing": "fast" | "medium" | "slow",
  "hook": "what grabs attention in the first ~3s",
  "caption": "a caption to post with the recreation",
  "hashtags": ["..."],
  "editingNotes": ["actionable tips to match this edit"]
}
Return one shots[] entry per frame I gave you, matching the Shot indexes.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analyze this reel${sourceName ? ` ("${sourceName}")` : ""}.` },
            ...imageParts,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from model");
    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    console.error("Reel analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
