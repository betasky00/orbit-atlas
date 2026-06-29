import type { CSSProperties } from "react";
import type { Zone, TemplateContent } from "@/lib/templates";

// NOTE: This component is deliberately written to satisfy Satori's CSS subset
// (the engine behind next/og) so the SAME markup renders both as live DOM in
// the browser AND as the final PNG on the server. Keep to: flex layout,
// absolute positioning, explicit px sizes, no shorthand `inset`, every element
// has display:flex.

interface CanvasProps {
  width: number;
  height: number;
  background?: string;
  zones: Zone[];
  content: TemplateContent;
  /** browser-preview downscale factor; the server renderer always uses 1 */
  scale?: number;
}

function isUrl(v?: string) {
  return !!v && (v.startsWith("http") || v.startsWith("data:") || v.startsWith("blob:"));
}

function ZoneEl({
  zone,
  content,
  width,
  height,
}: {
  zone: Zone;
  content: TemplateContent;
  width: number;
  height: number;
}) {
  const left = (zone.x / 100) * width;
  const top = (zone.y / 100) * height;
  const w = (zone.w / 100) * width;
  const h = (zone.h / 100) * height;

  const base: CSSProperties = {
    position: "absolute",
    left,
    top,
    width: w,
    height: h,
    display: "flex",
  };

  if (zone.type === "image" || zone.type === "logo") {
    // A baked-in zone.src (e.g. a logo) always wins over dynamic content.
    const src = zone.src ?? content[zone.key ?? "image"];
    if (!isUrl(src)) {
      return (
        <div
          style={{
            ...base,
            background: "#1b1b1f",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: zone.radius ?? 0,
          }}
        >
          <div style={{ display: "flex", color: "#52525b", fontSize: 28 }}>
            {zone.type === "logo" ? "logo" : "image"}
          </div>
        </div>
      );
    }
    return (
      <div style={{ ...base, overflow: "hidden", borderRadius: zone.radius ?? 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          style={{ width: w, height: h, objectFit: zone.objectFit ?? "cover" }}
        />
      </div>
    );
  }

  if (zone.type === "shape") {
    return (
      <div
        style={{
          ...base,
          background: zone.fill ?? "#000000",
          opacity: zone.opacity ?? 1,
          borderRadius: zone.radius ?? 0,
        }}
      />
    );
  }

  // text
  const raw = zone.text ?? content[zone.key ?? ""] ?? zone.placeholder ?? "";
  const text = zone.uppercase ? raw.toUpperCase() : raw;
  const justify =
    zone.align === "center" ? "center" : zone.align === "right" ? "flex-end" : "flex-start";
  const alignItems =
    zone.valign === "center" ? "center" : zone.valign === "bottom" ? "flex-end" : "flex-start";

  return (
    <div style={{ ...base, padding: zone.padding ?? 0, alignItems, justifyContent: justify }}>
      <div
        style={{
          display: "flex",
          width: "100%",
          fontSize: zone.fontSize ?? 48,
          fontWeight: zone.fontWeight ?? 400,
          color: zone.color ?? "#ffffff",
          lineHeight: zone.lineHeight ?? 1.1,
          textAlign: zone.align ?? "left",
          letterSpacing: zone.letterSpacing ?? 0,
        }}
      >
        {text}
      </div>
    </div>
  );
}

export function TemplateCanvas({
  width,
  height,
  background,
  zones,
  content,
  scale = 1,
}: CanvasProps) {
  const bgIsImage = isUrl(background);

  const root: CSSProperties = {
    position: "relative",
    display: "flex",
    width,
    height,
    overflow: "hidden",
    background: bgIsImage ? "#000000" : background ?? "#111111",
  };

  if (scale !== 1) {
    root.transform = `scale(${scale})`;
    root.transformOrigin = "top left";
  }

  return (
    <div style={root}>
      {bgIsImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={background}
          alt=""
          style={{ position: "absolute", left: 0, top: 0, width, height, objectFit: "cover" }}
        />
      )}
      {zones.map((zone) => (
        <ZoneEl key={zone.id} zone={zone} content={content} width={width} height={height} />
      ))}
    </div>
  );
}
