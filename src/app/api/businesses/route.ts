import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businesses = await db.business.findMany({
    where: { userId: session.user.id },
    include: {
      socialAccounts: true,
      _count: { select: { posts: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(businesses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, niche, color } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const business = await db.business.create({
    data: { name, niche, color: color ?? "#6366f1", userId: session.user.id },
    include: { socialAccounts: true },
  });

  return NextResponse.json(business);
}
