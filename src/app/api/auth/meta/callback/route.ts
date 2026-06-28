import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserPages } from "@/lib/meta";
import { ensureOwner } from "@/lib/owner";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?error=meta_auth_failed`
    );
  }

  // Exchange code for token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/meta/callback`,
        code,
      })
  );
  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?error=meta_token_failed`
    );
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
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?error=meta_save_failed`
    );
  }

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/accounts?success=meta_connected`
  );
}
