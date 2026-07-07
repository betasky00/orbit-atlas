import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SlideValueInput {
  index: number;
  slots: Record<string, string>;
}

// List carousel workflows for the user's businesses.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

const workflows = await db.carouselWorkflow.findMany({
  where: {
    business: { userId: session.user.id },
    ...(businessId && { businessId }),
  },
  include: { template: true },
  orderBy: { createdAt: "desc" },
});

return NextResponse.json(workflows);
}

// Create a carousel workflow ready to open in the Figma plugin: the outline
// (text per slide/slot) and images are provided directly so it has real
// content from the start, without going through the full AI pipeline.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const body = await req.json();
  const { businessId, templateId, socialAccountId, prompt, slides, images } = body;
  if (!businessId || !templateId) {
    return NextResponse.json({ error: "businessId and templateId required" }, { status: 400 });
  }

const business = await db.business.findFirst({ where: { id: businessId, userId: session.user.id } });
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

const template = await db.carouselTemplate.findUnique({ where: { id: templateId } });
  if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

const slideValues: SlideValueInput[] = Array.isArray(slides) ? slides : [];
  const outline = { slides: slideValues.map((s) => ({ index: s.index, slots: s.slots ?? {} })) };

const imagesInput: Record<string, string> = images ?? {};
  const imagesJson: Record<string, { imageUrl: string }> = {};
  for (const key of Object.keys(imagesInput)) {
    imagesJson[key] = { imageUrl: imagesInput[key] };
  }

const workflow = await db.carouselWorkflow.create({
  data: {
    businessId,
    templateId,
    createdById: session.user.id,
    socialAccountId: socialAccountId || null,
    prompt: prompt || `Carousel from template ${template.name}`,
    status: "AWAITING_FIGMA_EDIT",
    outline: JSON.stringify(outline),
    images: JSON.stringify(imagesJson),
  },
  include: { template: true },
});

return NextResponse.json(workflow);
}
