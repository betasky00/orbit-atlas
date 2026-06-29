import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentScopeWhere } from "@/lib/access";

export const dynamic = "force-dynamic";

// List templates the user may see (admin: all; member: shared + their accounts).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const where = await contentScopeWhere(session.user.id, session.user.role);
    const templates = await db.template.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        postType: t.postType,
        width: t.width,
        height: t.height,
        background: t.background,
        zones: JSON.parse(t.layout || "[]"),
        rules: t.rules ? JSON.parse(t.rules) : undefined,
        socialAccountId: t.socialAccountId,
      }))
    );
  } catch {
    return NextResponse.json([]);
  }
}

// Create or update a template.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const data = {
    name: b.name,
    postType: b.postType ?? null,
    width: b.width ?? 1080,
    height: b.height ?? 1080,
    background: b.background ?? null,
    layout: JSON.stringify(b.zones ?? []),
    rules: b.rules ? JSON.stringify(b.rules) : null,
    socialAccountId: b.socialAccountId ?? null,
    createdById: session.user.id,
  };

  // Members can't change which account a shared/other template targets.
  if (b.id && !b.id.startsWith("preset-")) {
    const t = await db.template.upsert({ where: { id: b.id }, update: data, create: { id: b.id, ...data } });
    return NextResponse.json({ id: t.id });
  }
  const t = await db.template.create({ data });
  return NextResponse.json({ id: t.id });
}
