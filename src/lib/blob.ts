import { put } from "@vercel/blob";

// Composited template images live as PNGs in Vercel Blob so the social APIs
// (which require a public image_url) can fetch them.
export async function uploadPng(buffer: Buffer | Uint8Array, filename: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Image hosting isn't configured. Add a Vercel Blob store (BLOB_READ_WRITE_TOKEN) to publish rendered images."
    );
  }
  const { url } = await put(filename, buffer as Buffer, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: true,
  });
  return url;
}

// Render a template+content to a hosted PNG URL, ready to post.
export async function renderAndHost(
  origin: string,
  payload: { width: number; height: number; background?: string; zones: unknown; content: unknown }
): Promise<string> {
  const res = await fetch(`${origin}/api/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to render template image");
  const arrayBuf = await res.arrayBuffer();
  return uploadPng(Buffer.from(arrayBuf), `post-${Date.now()}.png`);
}
