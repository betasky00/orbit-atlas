import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentScopeWhere } from "@/lib/access";

export const dynamic = "force-dynamic";

// List saved posts the user may see (admin: all; member: shared + their accounts).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const where = await contentScopeWhere(session.user.id, session.user.role);
    const posts = await db.savedPost.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json(
      posts.map((p) => ({
        id: p.id,
        name: p.name,
        caption: p.caption ?? "",
        hashtags: p.hashtags ? p.hashtags.split(" ").filter(Boolean) : [],
        firstComment: p.firstComment ?? "",
        template: JSON.parse(p.templateJson),
        content: JSON.parse(p.contentJson),
        platform: p.platform,
        socialAccountId: p.socialAccountId,
        scheduledAt: p.scheduledAt,
        status: p.status,
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}

// Create a saved post.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const post = await db.savedPost.create({
    data: {
      socialAccountId: b.socialAccountId ?? null,
      createdById: session.user.id,
      name: b.name ?? "Untitled",
      caption: b.caption ?? null,
      hashtags: Array.isArray(b.hashtags) ? b.hashtags.join(" ") : b.hashtags ?? null,
      firstComment: b.firstComment ?? null,
      templateJson: JSON.stringify(b.template ?? {}),
      contentJson: JSON.stringify(b.content ?? {}),
      platform: b.platform ?? null,
      scheduledAt: b.scheduledAt ? new Date(b.scheduledAt) : null,
      status: b.scheduledAt ? "scheduled" : "draft",
    },
  });
  return NextResponse.json({ id: post.id });
}
