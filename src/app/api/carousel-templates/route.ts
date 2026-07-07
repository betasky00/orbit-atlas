import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface SlideInput {
  index: number;
  type?: string;
  figmaFrameName: string;
  slots: { name: string; kind: "text" | "image" }[];
}

// List carousel templates visible to the user (their businesses + shared ones).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const businesses = await db.business.findMany({ where: { userId: session.user.id }, select: { id: true } });
  const businessIds = businesses.map((b) => b.id);

const templates = await db.carouselTemplate.findMany({
  where: { OR: [{ businessId: { in: businessIds } }, { businessId: null }] },
  include: { slides: { orderBy: { index: "asc" } } },
  orderBy: { createdAt: "desc" },
});

return NextResponse.json(templates);
}

// Create a carousel template with its slides (frames + slots matching the Figma file).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const body = await req.json();
  const { businessId, name, editorialStyle, description, slides } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

const slideInputs: SlideInput[] = Array.isArray(slides) ? slides : [];
  if (slideInputs.length === 0) {
    return NextResponse.json({ error: "At least one slide is required" }, { status: 400 });
  }

const template = await db.carouselTemplate.create({
  data: {
    businessId: businessId || null,
    name,
    editorialStyle: editorialStyle || null,
    description: description || null,
    slideCount: slideInputs.length,

    slides: {
      create: slideInputs.map((s, i) => ({
        index: s.index ?? i,
        type: s.type || null,
        figmaFrameName: s.figmaFrameName,
        slots: JSON.stringify(s.slots ?? []),
      })),
    },
  },
  include: { slides: { orderBy: { index: "asc" } } },
});

return NextResponse.json(template);
}
