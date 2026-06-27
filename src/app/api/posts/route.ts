import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { renderAndHost } from "@/lib/blob";
import { publishPost } from "@/lib/publish";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");
  const status = searchParams.get("status");

  const posts = await db.post.findMany({
    where: {
      business: { userId: session.user.id },
      ...(businessId && { businessId }),
      ...(status && { status }),
    },
    include: { accounts: { include: { socialAccount: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    businessId,
    caption,
    hashtags,
    firstComment,
    mediaUrls,
    mediaType,
    scheduledAt,
    socialAccountIds,
    publishNow,
    aiGenerated,
    template, // { width, height, background, zones, content } — composited to a PNG
    source,
    sourceData,
  } = body;

  // If a template was supplied, render it to a hosted PNG now so the same image
  // is used whether we publish immediately or later via cron.
  let renderedUrl: string | undefined;
  if (template?.zones) {
    try {
      const origin = new URL(req.url).origin;
      renderedUrl = await renderAndHost(origin, {
        width: template.width ?? 1080,
        height: template.height ?? 1080,
        background: template.background,
        zones: template.zones,
        content: template.content ?? {},
      });
    } catch (err) {
      // No blob store yet — save the post as draft with a clear message.
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? err.message
              : "Could not host the rendered image. Connect Vercel Blob to publish.",
        },
        { status: 400 }
      );
    }
  }

  const post = await db.post.create({
    data: {
      businessId,
      caption,
      hashtags: Array.isArray(hashtags) ? hashtags.join(" ") : hashtags,
      firstComment,
      mediaUrls: JSON.stringify(mediaUrls ?? []),
      renderedUrl,
      content: template?.content ? JSON.stringify(template.content) : null,
      mediaType: mediaType ?? "image",
      status: publishNow ? "publishing" : scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      aiGenerated: aiGenerated ?? false,
      source,
      sourceData: sourceData ? String(sourceData).slice(0, 4000) : null,
      accounts: {
        create: (socialAccountIds ?? []).map((id: string) => ({
          socialAccountId: id,
          status: "pending",
        })),
      },
    },
    include: { accounts: { include: { socialAccount: true } } },
  });

  if (publishNow) {
    if (post.accounts.length === 0) {
      await db.post.update({ where: { id: post.id }, data: { status: "draft" } });
      return NextResponse.json(
        { ...post, warning: "Saved as draft — connect a social account to publish." },
        { status: 200 }
      );
    }
    await publishPost(post.id);
    const final = await db.post.findUnique({
      where: { id: post.id },
      include: { accounts: { include: { socialAccount: true } } },
    });
    return NextResponse.json(final);
  }

  return NextResponse.json(post);
}
