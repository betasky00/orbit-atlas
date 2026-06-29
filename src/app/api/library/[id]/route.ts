import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json();
  await db.savedPost.update({
    where: { id },
    data: {
      ...(b.scheduledAt !== undefined
        ? { scheduledAt: b.scheduledAt ? new Date(b.scheduledAt) : null, status: b.scheduledAt ? "scheduled" : "draft" }
        : {}),
      ...(b.socialAccountId !== undefined ? { socialAccountId: b.socialAccountId } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.savedPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
