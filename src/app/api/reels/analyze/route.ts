import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Frame {
  time: number; // seconds into the video
  dataUrl: string; // downscaled JPEG
}

interface AnalyzeBody {
  frames: Frame[];
  duration: number;
  aspectRatio?: string;
  sourceName?: string;
}

// Reverse-engineer a reel's edit from sampled frames.
export async function POST(req: NextRequest) {
  try {
    const { frames, duration, aspectRatio = "9:16", sourceName } =
      (await req.json()) as AnalyzeBody;

    if (!frames?.length) {
      return NextResponse.json({ error: "frames required" }, { status: 400 });
    }

    // Build the multimodal message: each frame labelled with its timestamp so
    // the model can reason about cut timing.
    const imageParts = frames.map((f) => ({
      type: "image_url" as const,
      image_url: { url: f.dataUrl, detail: "low" as const },
    }));

    const timeline = frames.map((f) => `${f.time.toFixed(2)}s`).join(", ");

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a senior short-form video editor. You are given frames sampled from
a ${duration.toFixed(
            1
          )}s vertical reel (timestamps: ${timeline}). Reverse-engineer the EDIT so
someone can recreate the exact same structure with their own footage.

Detect: where the cuts are (group consecutive similar frames into one shot, split
when the scene changes), each shot's duration, the on-screen text and its position,
the transition style between shots, camera movement, the overall pacing, and the
likely music vibe/energy (infer from cut rhythm and content — state it's an estimate).

Respond with STRICT JSON only:
{
  "totalDuration": ${duration},
  "aspectRatio": "${aspectRatio}",
  "pacing": "fast" | "medium" | "slow",
  "musicVibe": "short description of the music mood/genre/energy",
  "bpmGuess": number or null,
  "hook": "what grabs attention in the first ~3 seconds",
  "shots": [
    {
      "index": 0,
      "start": 0.0, "end": 1.2, "duration": 1.2,
      "kind": "clip" | "image" | "text-card",
      "description": "what is shown / what the user should film here",
      "onScreenText": "exact text on screen or null",
      "textPosition": "top" | "center" | "bottom",
      "transitionIn": "cut" | "fade" | "dissolve" | "slide" | "zoom-in" | "zoom-out" | "whip-pan" | "match-cut" | "flash",
      "transitionOut": "cut" | "fade" | "...",
      "cameraMove": "e.g. static, push-in, handheld",
      "replaceable": true
    }
  ],
  "caption": "a caption the user could post with their recreation",
  "hashtags": ["..."],
  "editingNotes": ["actionable tips to match this edit, e.g. 'cut on every beat', 'keep each clip under 1.5s'"]
}
Make shot timings add up to roughly the total duration. Mark text-only frames as kind "text-card".`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this reel${
                sourceName ? ` ("${sourceName}")` : ""
              } and return the blueprint JSON. The frames are in chronological order.`,
            },
            ...imageParts,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content from model");

    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Reel analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
