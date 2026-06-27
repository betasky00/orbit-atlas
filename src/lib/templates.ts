// ---------------------------------------------------------------------------
// Template model
//
// A Template is a reusable blueprint for a post. It has two halves:
//   1. `zones`  — the VISUAL layout (where the image / headline / logo sit)
//   2. `rules`  — the CONTENT logic (tone, length, hashtags) the AI must follow
//
// The same `zones` array is rendered two ways from ONE component
// (TemplateCanvas): live in the browser for instant preview, and server-side
// via next/og to produce the final PNG that actually gets posted.
// ---------------------------------------------------------------------------

export type ZoneType = "image" | "text" | "shape" | "logo";

export interface Zone {
  id: string;
  type: ZoneType;
  /** which key in the content object fills this zone (e.g. "image", "headline") */
  key?: string;
  /** position + size as a percentage (0–100) of the canvas */
  x: number;
  y: number;
  w: number;
  h: number;

  // text zones
  text?: string; // static text that never changes (e.g. a fixed tagline)
  placeholder?: string;
  fontSize?: number; // px at full canvas size
  fontWeight?: number;
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "center" | "bottom";
  lineHeight?: number;
  uppercase?: boolean;
  letterSpacing?: number;
  padding?: number;

  // shape / image zones
  fill?: string;
  opacity?: number;
  radius?: number;
  objectFit?: "cover" | "contain";
}

export interface TemplateRules {
  tone?: string;
  audience?: string;
  headlineMaxWords?: number;
  bodyMaxWords?: number;
  hashtagCount?: number;
  hashtagStyle?: string;
  ctaStyle?: string;
  doList?: string[];
  dontList?: string[];
  extra?: string;
}

/** Content that fills a template's zones. Keys match Zone.key. */
export type TemplateContent = Record<string, string>;

export interface TemplateDef {
  id: string;
  name: string;
  postType?: string;
  width: number;
  height: number;
  background?: string; // hex color or image URL
  zones: Zone[];
  rules?: TemplateRules;
  sampleImage?: string;
  preset?: boolean;
}

// ---------------------------------------------------------------------------
// Starter presets — usable immediately, no upload required.
// ---------------------------------------------------------------------------

export const PRESET_TEMPLATES: TemplateDef[] = [
  {
    id: "preset-news",
    name: "Breaking News",
    postType: "news",
    width: 1080,
    height: 1080,
    background: "#0b0b0f",
    preset: true,
    zones: [
      { id: "img", type: "image", key: "image", x: 0, y: 0, w: 100, h: 62, objectFit: "cover" },
      // dark gradient bar behind the headline
      { id: "bar", type: "shape", x: 0, y: 58, w: 100, h: 42, fill: "#0b0b0f", opacity: 1 },
      { id: "kicker", type: "text", key: "kicker", x: 6, y: 63, w: 88, h: 7, text: "BREAKING", uppercase: true, fontSize: 30, fontWeight: 700, color: "#f43f5e", align: "left", valign: "center", letterSpacing: 3 },
      { id: "headline", type: "text", key: "headline", x: 6, y: 70, w: 88, h: 22, fontSize: 64, fontWeight: 800, color: "#ffffff", align: "left", valign: "top", lineHeight: 1.05 },
      { id: "brand", type: "text", key: "brand", x: 6, y: 92, w: 88, h: 6, fontSize: 26, fontWeight: 600, color: "#9ca3af", align: "left", valign: "center", uppercase: true, letterSpacing: 2 },
    ],
    rules: {
      tone: "urgent, factual, punchy",
      headlineMaxWords: 12,
      hashtagCount: 6,
      ctaStyle: "Drive readers to the link in bio for the full story",
      doList: ["Lead with the most important fact", "Stay neutral and credible"],
      dontList: ["No clickbait", "No emojis in the headline"],
    },
  },
  {
    id: "preset-quote",
    name: "Quote Card",
    postType: "quote",
    width: 1080,
    height: 1080,
    background: "#111111",
    preset: true,
    zones: [
      { id: "img", type: "image", key: "image", x: 0, y: 0, w: 100, h: 100, objectFit: "cover" },
      { id: "overlay", type: "shape", x: 0, y: 0, w: 100, h: 100, fill: "#000000", opacity: 0.55 },
      { id: "mark", type: "text", x: 8, y: 14, w: 30, h: 18, text: "“", fontSize: 180, fontWeight: 800, color: "#7c3aed", align: "left", valign: "top" },
      { id: "quote", type: "text", key: "headline", x: 8, y: 32, w: 84, h: 36, fontSize: 58, fontWeight: 700, color: "#ffffff", align: "left", valign: "center", lineHeight: 1.15 },
      { id: "author", type: "text", key: "brand", x: 8, y: 80, w: 84, h: 7, fontSize: 30, fontWeight: 600, color: "#a78bfa", align: "left", valign: "center", uppercase: true, letterSpacing: 2 },
    ],
    rules: {
      tone: "inspirational, concise",
      headlineMaxWords: 22,
      hashtagCount: 8,
      doList: ["Make it quotable and shareable"],
      dontList: ["No hashtags inside the quote text"],
    },
  },
  {
    id: "preset-product",
    name: "Product / Announcement",
    postType: "product",
    width: 1080,
    height: 1080,
    background: "#ffffff",
    preset: true,
    zones: [
      { id: "img", type: "image", key: "image", x: 0, y: 0, w: 100, h: 68, objectFit: "cover" },
      { id: "panel", type: "shape", x: 0, y: 66, w: 100, h: 34, fill: "#7c3aed", opacity: 1 },
      { id: "headline", type: "text", key: "headline", x: 7, y: 70, w: 86, h: 16, fontSize: 60, fontWeight: 800, color: "#ffffff", align: "left", valign: "top", lineHeight: 1.05 },
      { id: "sub", type: "text", key: "body", x: 7, y: 86, w: 70, h: 10, fontSize: 30, fontWeight: 500, color: "#ede9fe", align: "left", valign: "center", lineHeight: 1.2 },
    ],
    rules: {
      tone: "exciting, benefit-driven",
      headlineMaxWords: 8,
      bodyMaxWords: 16,
      hashtagCount: 10,
      ctaStyle: "Clear call to action (Shop now / Book today / DM us)",
    },
  },
];

export function getPresetById(id: string): TemplateDef | undefined {
  return PRESET_TEMPLATES.find((t) => t.id === id);
}
