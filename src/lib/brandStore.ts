"use client";

// Brand Kit — one per workspace, persisted in localStorage. Used to auto-fill
// the studio (handle, logo, voice) and prefill business context.

export interface BrandKit {
  businessName: string;
  niche: string;
  handle: string; // e.g. @luxegardens
  voice: string; // brand voice description for the AI
  primaryColor: string;
  secondaryColor: string;
  logo?: string; // data URL
}

const KEY = "orbit.brand";

const DEFAULT: BrandKit = {
  businessName: "",
  niche: "",
  handle: "",
  voice: "",
  primaryColor: "#1c1a17",
  secondaryColor: "#7c3aed",
};

export function loadBrand(): BrandKit {
  if (typeof window === "undefined") return DEFAULT;
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT;
  }
}

export function saveBrand(b: BrandKit) {
  localStorage.setItem(KEY, JSON.stringify(b));
}
