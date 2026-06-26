// Meta Graph API helpers (Instagram + Facebook)

const META_GRAPH_BASE = "https://graph.facebook.com/v19.0";

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    name: string;
    username: string;
    profile_picture_url: string;
    followers_count: number;
  };
}

export async function getUserPages(userAccessToken: string): Promise<MetaPage[]> {
  const res = await fetch(
    `${META_GRAPH_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account{id,name,username,profile_picture_url,followers_count}&access_token=${userAccessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.data;
}

export async function publishInstagramPhoto(params: {
  igAccountId: string;
  imageUrl: string;
  caption: string;
  accessToken: string;
}): Promise<{ id: string }> {
  const { igAccountId, imageUrl, caption, accessToken } = params;

  // Step 1: Create media container
  const containerRes = await fetch(
    `${META_GRAPH_BASE}/${igAccountId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );
  const container = await containerRes.json();
  if (container.error) throw new Error(container.error.message);

  // Step 2: Publish
  const publishRes = await fetch(
    `${META_GRAPH_BASE}/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: accessToken,
      }),
    }
  );
  const published = await publishRes.json();
  if (published.error) throw new Error(published.error.message);

  return published;
}

export async function publishInstagramCarousel(params: {
  igAccountId: string;
  imageUrls: string[];
  caption: string;
  accessToken: string;
}): Promise<{ id: string }> {
  const { igAccountId, imageUrls, caption, accessToken } = params;

  // Step 1: Create item containers
  const itemIds = await Promise.all(
    imageUrls.map(async (url) => {
      const res = await fetch(`${META_GRAPH_BASE}/${igAccountId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: url,
          is_carousel_item: true,
          access_token: accessToken,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.id;
    })
  );

  // Step 2: Create carousel container
  const carouselRes = await fetch(`${META_GRAPH_BASE}/${igAccountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: itemIds,
      caption,
      access_token: accessToken,
    }),
  });
  const carousel = await carouselRes.json();
  if (carousel.error) throw new Error(carousel.error.message);

  // Step 3: Publish
  const publishRes = await fetch(
    `${META_GRAPH_BASE}/${igAccountId}/media_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: carousel.id,
        access_token: accessToken,
      }),
    }
  );
  const published = await publishRes.json();
  if (published.error) throw new Error(published.error.message);

  return published;
}

export async function publishFacebookPost(params: {
  pageId: string;
  message: string;
  imageUrl?: string;
  accessToken: string;
}): Promise<{ id: string }> {
  const { pageId, message, imageUrl, accessToken } = params;

  const endpoint = imageUrl
    ? `${META_GRAPH_BASE}/${pageId}/photos`
    : `${META_GRAPH_BASE}/${pageId}/feed`;

  const body: Record<string, string> = imageUrl
    ? { url: imageUrl, caption: message, access_token: accessToken }
    : { message, access_token: accessToken };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return data;
}

export async function getInstagramInsights(params: {
  igAccountId: string;
  accessToken: string;
}): Promise<{
  followers: number;
  reach: number;
  impressions: number;
  profileViews: number;
}> {
  const { igAccountId, accessToken } = params;

  const res = await fetch(
    `${META_GRAPH_BASE}/${igAccountId}?fields=followers_count,media_count&access_token=${accessToken}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  return {
    followers: data.followers_count ?? 0,
    reach: 0,
    impressions: 0,
    profileViews: 0,
  };
}
