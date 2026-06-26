import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishInstagramPhoto, publishInstagramCarousel, publishFacebookPost } from "@/lib/meta";

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
    include: {
      accounts: { include: { socialAccount: true } },
    },
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
  } = body;

  const post = await db.post.create({
    data: {
      businessId,
      caption,
      hashtags: Array.isArray(hashtags) ? hashtags.join(" ") : hashtags,
      firstComment,
      mediaUrls: JSON.stringify(mediaUrls ?? []),
      mediaType: mediaType ?? "image",
      status: publishNow ? "published" : scheduledAt ? "scheduled" : "draft",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: publishNow ? new Date() : null,
      aiGenerated: aiGenerated ?? false,
      accounts: {
        create: (socialAccountIds ?? []).map((id: string) => ({
          socialAccountId: id,
          status: "pending",
        })),
      },
    },
    include: {
      accounts: { include: { socialAccount: true } },
    },
  });

  // Publish immediately if requested
  if (publishNow && mediaUrls?.length > 0) {
    const fullCaption = [caption, hashtags ? `\n\n${Array.isArray(hashtags) ? hashtags.map((h: string) => `#${h}`).join(" ") : hashtags}` : ""].join("");

    for (const pa of post.accounts) {
      const account = pa.socialAccount;
      try {
        let platformPostId: string | undefined;

        if (account.platform === "instagram") {
          if (mediaUrls.length > 1) {
            const result = await publishInstagramCarousel({
              igAccountId: account.accountId,
              imageUrls: mediaUrls,
              caption: fullCaption,
              accessToken: account.accessToken,
            });
            platformPostId = result.id;
          } else {
            const result = await publishInstagramPhoto({
              igAccountId: account.accountId,
              imageUrl: mediaUrls[0],
              caption: fullCaption,
              accessToken: account.accessToken,
            });
            platformPostId = result.id;
          }
        } else if (account.platform === "facebook") {
          const result = await publishFacebookPost({
            pageId: account.accountId,
            message: fullCaption,
            imageUrl: mediaUrls[0],
            accessToken: account.accessToken,
          });
          platformPostId = result.id;
        }

        await db.postAccount.update({
          where: { id: pa.id },
          data: { status: "published", platformPostId, publishedAt: new Date() },
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        await db.postAccount.update({
          where: { id: pa.id },
          data: { status: "failed", error: errorMsg },
        });
      }
    }
  }

  return NextResponse.json(post);
}
