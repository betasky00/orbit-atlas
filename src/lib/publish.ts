import { db } from "@/lib/db";
import {
  publishInstagramPhoto,
  publishInstagramCarousel,
  publishFacebookPost,
} from "@/lib/meta";

// Shared publishing engine used by both the "post now" API and the cron job.
// Takes a post id whose PostAccount rows are already created, pushes the media
// to each connected platform, and records per-account success/failure.
export async function publishPost(postId: string): Promise<void> {
  const post = await db.post.findUnique({
    where: { id: postId },
    include: { accounts: { include: { socialAccount: true } } },
  });
  if (!post) throw new Error("Post not found");

  const mediaUrls: string[] = post.renderedUrl
    ? [post.renderedUrl]
    : JSON.parse(post.mediaUrls || "[]");

  const hashtagLine = post.hashtags
    ? `\n\n${post.hashtags
        .split(/\s+/)
        .filter(Boolean)
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
        .join(" ")}`
    : "";
  const fullCaption = `${post.caption ?? ""}${hashtagLine}`;

  for (const pa of post.accounts) {
    const account = pa.socialAccount;
    try {
      let platformPostId: string | undefined;

      if (account.platform === "instagram") {
        if (mediaUrls.length > 1) {
          const r = await publishInstagramCarousel({
            igAccountId: account.accountId,
            imageUrls: mediaUrls,
            caption: fullCaption,
            accessToken: account.accessToken,
          });
          platformPostId = r.id;
        } else if (mediaUrls.length === 1) {
          const r = await publishInstagramPhoto({
            igAccountId: account.accountId,
            imageUrl: mediaUrls[0],
            caption: fullCaption,
            accessToken: account.accessToken,
          });
          platformPostId = r.id;
        } else {
          throw new Error("No media to publish");
        }
      } else if (account.platform === "facebook") {
        const r = await publishFacebookPost({
          pageId: account.accountId,
          message: fullCaption,
          imageUrl: mediaUrls[0],
          accessToken: account.accessToken,
        });
        platformPostId = r.id;
      } else {
        // TikTok requires the chunked video-upload flow; skip image posts.
        throw new Error(`Publishing to ${account.platform} not yet supported for this media type`);
      }

      await db.postAccount.update({
        where: { id: pa.id },
        data: { status: "published", platformPostId, publishedAt: new Date() },
      });
    } catch (err) {
      await db.postAccount.update({
        where: { id: pa.id },
        data: { status: "failed", error: err instanceof Error ? err.message : "Unknown error" },
      });
    }
  }

  // Roll up overall post status.
  const refreshed = await db.post.findUnique({
    where: { id: postId },
    include: { accounts: true },
  });
  const allPublished = refreshed?.accounts.every((a) => a.status === "published");
  const anyPublished = refreshed?.accounts.some((a) => a.status === "published");
  await db.post.update({
    where: { id: postId },
    data: {
      status: allPublished ? "published" : anyPublished ? "published" : "failed",
      publishedAt: anyPublished ? new Date() : null,
    },
  });
}
