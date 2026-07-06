import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessAccount } from "@/lib/access";

export const dynamic = "force-dynamic";

interface SlotDef { name: string; kind: "text" | "image"; }
interface OutlineSlide { index: number; type?: string; slots?: Record<string, string>; }
interface ImageEntry { imageUrl?: string; }

// Returns the carousel content in the shape expected by the Figma plugin:
// { workflowId, slides: [{ figmaFrameName, slots: [{ name, type, value }] }] }
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const { id } = await params;
  const workflow = await db.carouselWorkflow.findUnique({
    where: { id },
    include: { template: { include: { slides: { orderBy: { index: "asc" } } } } },
  });
  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 });

if (workflow.socialAccountId) {
  const allowed = await canAccessAccount(session.user.id, session.user.role, workflow.socialAccountId);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

const outline: { slides?: OutlineSlide[] } = workflow.outline ? JSON.parse(workflow.outline) : {};
  const images: Record<string, ImageEntry> = workflow.images ? JSON.parse(workflow.images) : {};

const slides = (workflow.template.slides ?? []).map((slideTemplate) => {
  const slotDefs: SlotDef[] = JSON.parse(slideTemplate.slots || "[]");
  const outlineSlide = outline.slides?.find((s) => s.index === slideTemplate.index);
  const imageForSlide = images[String(slideTemplate.index)];

                                                    const slots = slotDefs.map((def) => {
                                                      if (def.kind === "image") {
                                                        return { name: def.name, type: "image" as const, value: imageForSlide?.imageUrl ?? "" };
                                                      }
                                                      return { name: def.name, type: "text" as const, value: outlineSlide?.slots?.[def.name] ?? "" };
                                                    });

                                                    return { figmaFrameName: slideTemplate.figmaFrameName, slots };
});

return NextResponse.json({ workflowId: workflow.id, slides });
}
