"use client";

import type { Zone, TemplateContent } from "@/lib/templates";

// Server-backed Content Library (shared across the team, scoped by account access).

export interface LibraryItem {
  id: string;
  name: string;
  caption: string;
  hashtags: string[];
  firstComment?: string;
  template: { width: number; height: number; background?: string; zones: Zone[] };
  content: TemplateContent;
  platform?: string;
  socialAccountId?: string | null;
  scheduledAt?: string | null;
  status: "draft" | "scheduled" | "posted";
}

export async function fetchLibrary(): Promise<LibraryItem[]> {
  try {
    const res = await fetch("/api/library");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveLibraryItem(item: Omit<LibraryItem, "id" | "status">): Promise<string | null> {
  try {
    const res = await fetch("/api/library", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

export async function updateLibraryItem(id: string, patch: Partial<LibraryItem>): Promise<void> {
  try {
    await fetch(`/api/library/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch {
    /* ignore */
  }
}

export async function deleteLibraryItem(id: string): Promise<void> {
  try {
    await fetch(`/api/library/${id}`, { method: "DELETE" });
  } catch {
    /* ignore */
  }
}

// Downscale a data URL to keep payloads small while staying post-quality.
export async function downscaleDataUrl(dataUrl: string, max = 1080): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
