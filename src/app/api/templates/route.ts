import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  const templates = await db.template.findMany({
    where: {
      business: { userId: session.user.id },
      ...(businessId && { businessId }),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { businessId, name, postType, width, height, background, zones, rules, sampleImage } = body;

  if (!businessId || !name) {
    return NextResponse.json({ error: "businessId and name required" }, { status: 400 });
  }

  const template = await db.template.create({
    data: {
      businessId,
      name,
      postType,
      width: width ?? 1080,
      height: height ?? 1080,
      background,
      layout: JSON.stringify(zones ?? []),
      rules: rules ? JSON.stringify(rules) : null,
      sampleImage,
    },
  });
  return NextResponse.json(template);
}
