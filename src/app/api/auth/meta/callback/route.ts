import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserPages } from "@/lib/meta";
import { ensureOwner } from "@/lib/owner";
import { originFrom } from "@/lib/origin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId
  const error = searchParams.get("error");

  const base = originFrom(req);
  const fail = (reason: string) =>
    NextResponse.redirect(`${base}/accounts?error=${encodeURIComponent(reason)}`);

  if (error || !code || !state) {
    return fail(searchParams.get("error_description") || "meta_auth_cancelled");
  }

  // Exchange code for token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: `${base}/api/auth/meta/callback`,
        code,
      })
  );
  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    // Surface the real Meta reason so we can fix it (bad secret, redirect
    // mismatch, etc.) instead of a generic code.
    return fail(`Meta: ${tokenData.error.message ?? "token exchange failed"}`);
  }

  // Get long-lived token
  const llTokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        fb_exchange_token: tokenData.access_token,
      })
  );
  const llToken = await llTokenRes.json();
  const accessToken = llToken.access_token ?? tokenData.access_token;

  // Get user's pages + IG accounts
  try {
    await ensureOwner();
    const pages = await getUserPages(accessToken);

    if (!pages || pages.length === 0) {
      return fail(
        "No Facebook Page found. Your Instagram must be a Business/Creator account linked to a Facebook Page you admin."
      );
    }

    // Find the user's first business or create a default one
    let business = await db.business.findFirst({
      where: { userId: state },
    });

    if (!business) {
      business = await db.business.create({
        data: {
          name: "My Business",
          userId: state,
        },
      });
    }

    // Upsert each connected account
    for (const page of pages) {
      // Facebook Page
      await db.socialAccount.upsert({
        where: { platform_accountId: { platform: "facebook", accountId: page.id } },
        update: {
          displayName: page.name,
          accessToken: page.access_token,
          businessId: business.id,
        },
        create: {
          platform: "facebook",
          accountId: page.id,
          username: page.name,
          displayName: page.name,
          accessToken: page.access_token,
          businessId: business.id,
        },
      });

      // Instagram Business Account
      if (page.instagram_business_account) {
        const ig = page.instagram_business_account;
        await db.socialAccount.upsert({
          where: { platform_accountId: { platform: "instagram", accountId: ig.id } },
          update: {
            username: ig.username,
            displayName: ig.name,
            avatar: ig.profile_picture_url,
            accessToken: page.access_token,
            businessId: business.id,
          },
          create: {
            platform: "instagram",
            accountId: ig.id,
            username: ig.username,
            displayName: ig.name,
            avatar: ig.profile_picture_url,
            accessToken: page.access_token,
            businessId: business.id,
          },
        });
      }
    }
  } catch (err) {
    console.error("Meta callback error:", err);
    return fail(`Save failed: ${err instanceof Error ? err.message : "unknown error"}`);
  }

  return NextResponse.redirect(`${base}/accounts?success=meta_connected`);
}
