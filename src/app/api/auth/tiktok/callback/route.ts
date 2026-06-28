import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeTikTokCode, getTikTokUserInfo } from "@/lib/tiktok";
import { ensureOwner } from "@/lib/owner";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // userId
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?error=tiktok_auth_failed`
    );
  }

  try {
    await ensureOwner();
    const tokens = await exchangeTikTokCode(code);
    const userInfo = await getTikTokUserInfo(tokens.access_token);

    let business = await db.business.findFirst({ where: { userId: state } });
    if (!business) {
      business = await db.business.create({
        data: { name: "My Business", userId: state },
      });
    }

    await db.socialAccount.upsert({
      where: {
        platform_accountId: { platform: "tiktok", accountId: tokens.open_id },
      },
      update: {
        username: userInfo.username ?? userInfo.display_name,
        displayName: userInfo.display_name,
        avatar: userInfo.avatar_url,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        businessId: business.id,
      },
      create: {
        platform: "tiktok",
        accountId: tokens.open_id,
        username: userInfo.username ?? userInfo.display_name,
        displayName: userInfo.display_name,
        avatar: userInfo.avatar_url,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        businessId: business.id,
      },
    });
  } catch (err) {
    console.error("TikTok callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?error=tiktok_save_failed`
    );
  }

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/accounts?success=tiktok_connected`
  );
}
