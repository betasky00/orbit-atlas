import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePostContent, generateBio, getBestPostingTimes } from "@/lib/openai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type, ...params } = body;

  try {
    switch (type) {
      case "post":
        return NextResponse.json(await generatePostContent(params));
      case "bio":
        return NextResponse.json(await generateBio(params));
      case "times":
        return NextResponse.json(await getBestPostingTimes(params));
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
  } catch (err) {
    console.error("AI generate error:", err);
    return NextResponse.json(
      { error: "AI generation failed" },
      { status: 500 }
    );
  }
}
