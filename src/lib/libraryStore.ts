"use client";

import type { Zone, TemplateContent } from "@/lib/templates";

// Content Library — every saved/generated post, in localStorage. Each item is
// self-contained (carries its own template snapshot) so it can be previewed and
// re-rendered even if the source template is later changed or deleted.

export interface LibraryItem {
  id: string;
  createdAt: number;
  name: string;
  caption: string;
  hashtags: string[];
  firstComment?: string;
  template: { width: number; height: number; background?: string; zones: Zone[] };
  content: TemplateContent;
  platform?: string;
  scheduledAt?: string | null; // ISO datetime
  status: "draft" | "scheduled" | "posted";
}

const KEY = "orbit.library";
const MAX_ITEMS = 40;

export function loadLibrary(): LibraryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function persist(items: LibraryItem[]) {
  // Keep newest first, cap the count, and degrade gracefully if storage is full.
  const trimmed = [...items].sort((a, b) => b.createdAt - a.createdAt).slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // quota exceeded — drop the oldest half and retry once
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed.slice(0, Math.ceil(trimmed.length / 2))));
    } catch {
      /* give up silently */
    }
  }
}

export function saveItem(item: LibraryItem): LibraryItem {
  const items = loadLibrary();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  persist(items);
  return item;
}

export function deleteItem(id: string) {
  persist(loadLibrary().filter((i) => i.id !== id));
}

export function updateItem(id: string, patch: Partial<LibraryItem>) {
  const items = loadLibrary().map((i) => (i.id === id ? { ...i, ...patch } : i));
  persist(items);
}

// Downscale a data URL to keep localStorage small while staying post-quality.
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
