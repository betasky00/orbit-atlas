import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { TemplateCanvas } from "@/components/template/TemplateCanvas";
import type { Zone, TemplateContent } from "@/lib/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RenderBody {
  width?: number;
  height?: number;
  background?: string;
  zones: Zone[];
  content: TemplateContent;
}

// POST a template + content → get back the composited PNG.
// This is the single source of truth for the final image that gets posted.
export async function POST(req: NextRequest) {
  try {
    const { width = 1080, height = 1080, background, zones, content } =
      (await req.json()) as RenderBody;

    return new ImageResponse(
      (
        <TemplateCanvas
          width={width}
          height={height}
          background={background}
          zones={zones}
          content={content ?? {}}
        />
      ),
      { width, height }
    );
  } catch (err) {
    console.error("Render error:", err);
    return new Response(JSON.stringify({ error: "Render failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
