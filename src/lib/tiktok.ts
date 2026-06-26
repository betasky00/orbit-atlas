// TikTok Content Posting API helpers

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

export async function getTikTokCreatorInfo(accessToken: string) {
  const res = await fetch(
    `${TIKTOK_API_BASE}/post/publish/creator_info/query/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
    }
  );
  const data = await res.json();
  if (data.error?.code !== "ok") throw new Error(data.error?.message);
  return data.data;
}

export async function initTikTokVideoUpload(params: {
  accessToken: string;
  title: string;
  videoSize: number;
  chunkSize: number;
  totalChunkCount: number;
}) {
  const { accessToken, title, videoSize, chunkSize, totalChunkCount } = params;

  const res = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: videoSize,
        chunk_size: chunkSize,
        total_chunk_count: totalChunkCount,
      },
    }),
  });

  const data = await res.json();
  if (data.error?.code !== "ok") throw new Error(data.error?.message);
  return data.data;
}

export function getTikTokOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    response_type: "code",
    scope: "user.info.basic,video.publish,video.upload",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/tiktok/callback`,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

export async function exchangeTikTokCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
}> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/tiktok/callback`,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error_description ?? data.error);
  return data;
}

export async function getTikTokUserInfo(accessToken: string) {
  const res = await fetch(
    `${TIKTOK_API_BASE}/user/info/?fields=open_id,union_id,avatar_url,display_name,username`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await res.json();
  if (data.error?.code !== "ok") throw new Error(data.error?.message);
  return data.data.user;
}
