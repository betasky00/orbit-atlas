"use client";

import { PRESET_TEMPLATES, type TemplateDef } from "@/lib/templates";

// Lightweight client store so templates work instantly without auth/DB.
// User-created templates persist in localStorage; presets are always available.
// (The /api/templates route is the eventual server-side home once login is on.)

const KEY = "orbit.templates";

export function loadUserTemplates(): TemplateDef[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function allTemplates(): TemplateDef[] {
  return [...PRESET_TEMPLATES, ...loadUserTemplates()];
}

export function saveUserTemplate(t: TemplateDef): TemplateDef {
  const list = loadUserTemplates();
  const idx = list.findIndex((x) => x.id === t.id);
  if (idx >= 0) list[idx] = t;
  else list.push(t);
  localStorage.setItem(KEY, JSON.stringify(list));
  return t;
}

export function deleteUserTemplate(id: string) {
  const list = loadUserTemplates().filter((x) => x.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
