"use client";

import { PRESET_TEMPLATES, type TemplateDef } from "@/lib/templates";

// Server-backed templates (shared across the team, scoped by account access),
// merged with the read-only built-in presets for display.

export type ServerTemplate = TemplateDef & { socialAccountId?: string | null };

export async function fetchTemplates(): Promise<ServerTemplate[]> {
  try {
    const res = await fetch("/api/templates");
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Presets + the user's server templates (presets first).
export async function fetchAllTemplates(): Promise<ServerTemplate[]> {
  const server = await fetchTemplates();
  return [...PRESET_TEMPLATES, ...server];
}

export async function saveTemplate(
  t: TemplateDef,
  socialAccountId?: string | null
): Promise<string | null> {
  try {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...t, socialAccountId: socialAccountId ?? null }),
    });
    const data = await res.json();
    return data.id ?? null;
  } catch {
    return null;
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
  } catch {
    /* ignore */
  }
}
