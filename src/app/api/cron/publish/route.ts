import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publishPost } from "@/lib/publish";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Runs on a schedule (see vercel.json). Finds every scheduled post whose time
// has arrived and publishes it. Secured with CRON_SECRET when set.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const due = await db.post.findMany({
    where: { status: "scheduled", scheduledAt: { lte: new Date() } },
    select: { id: true },
    take: 25,
  });

  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const { id } of due) {
    try {
      await publishPost(id);
      results.push({ id, ok: true });
    } catch (err) {
      results.push({ id, ok: false, error: err instanceof Error ? err.message : "failed" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
