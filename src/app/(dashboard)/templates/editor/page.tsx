"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Type,
  Image as ImageIcon,
  Square,
  Trash2,
  Save,
  Upload,
  Sparkles,
} from "lucide-react";
import { allTemplates, saveUserTemplate } from "@/lib/templateStore";
import type { TemplateDef, Zone, ZoneType, TemplateRules } from "@/lib/templates";

const DISPLAY_W = 420;

const SIZES = [
  { label: "Square 1:1", w: 1080, h: 1080 },
  { label: "Portrait 4:5", w: 1080, h: 1350 },
  { label: "Story 9:16", w: 1080, h: 1920 },
];

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const uid = () => Math.random().toString(36).slice(2, 8);

function newZone(type: ZoneType): Zone {
  const base = { id: uid(), type, x: 30, y: 40, w: 40, h: 14 } as Zone;
  if (type === "text")
    return { ...base, key: "headline", fontSize: 60, fontWeight: 800, color: "#ffffff", align: "left", valign: "top", lineHeight: 1.1 };
  if (type === "logo") return { ...base, w: 18, h: 12, x: 6, y: 6, objectFit: "contain" };
  if (type === "image") return { ...base, key: "image", x: 0, y: 0, w: 100, h: 60, objectFit: "cover" };
  return { ...base, type: "shape", fill: "#000000", opacity: 0.4, h: 30, x: 0, y: 60, w: 100 };
}

function EditorInner() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const [name, setName] = useState("My Template");
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [background, setBackground] = useState("#111111");
  const [zones, setZones] = useState<Zone[]>([]);
  const [rules, setRules] = useState<TemplateRules>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const zoneFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    const t = allTemplates().find((x) => x.id === id);
    if (t) {
      setName(t.preset ? `${t.name} (copy)` : t.name);
      setWidth(t.width);
      setHeight(t.height);
      setBackground(t.background ?? "#111111");
      setZones(t.zones.map((z) => ({ ...z })));
      setRules(t.rules ?? {});
    }
  }, [id]);

  const scale = DISPLAY_W / width;
  const dispH = height * scale;
  const selected = zones.find((z) => z.id === selectedId) ?? null;

  const update = (zid: string, patch: Partial<Zone>) =>
    setZones((zs) => zs.map((z) => (z.id === zid ? { ...z, ...patch } : z)));

  const startDrag = (e: React.PointerEvent, z: Zone, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(z.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const orig = { ...z };
    const move = (ev: PointerEvent) => {
      const dxPct = ((ev.clientX - startX) / DISPLAY_W) * 100;
      const dyPct = ((ev.clientY - startY) / dispH) * 100;
      if (mode === "move") {
        update(z.id, {
          x: clamp(orig.x + dxPct, 0, 100 - orig.w),
          y: clamp(orig.y + dyPct, 0, 100 - orig.h),
        });
      } else {
        update(z.id, {
          w: clamp(orig.w + dxPct, 4, 100 - orig.x),
          h: clamp(orig.h + dyPct, 3, 100 - orig.y),
        });
      }
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const addZone = (type: ZoneType) => {
    const z = newZone(type);
    setZones((zs) => [...zs, z]);
    setSelectedId(z.id);
  };

  const removeSelected = () => {
    if (!selected) return;
    setZones((zs) => zs.filter((z) => z.id !== selected.id));
    setSelectedId(null);
  };

  const onZoneImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    const reader = new FileReader();
    reader.onload = () => update(selected.id, { src: reader.result as string });
    reader.readAsDataURL(file);
  };

  const onBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBackground(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = () => {
    const tpl: TemplateDef = {
      id: id && !id.startsWith("preset-") ? id : `tpl-${Date.now()}`,
      name: name || "My Template",
      width,
      height,
      background,
      zones,
      rules,
    };
    saveUserTemplate(tpl);
    router.push("/templates");
  };

  const bgIsImage = background.startsWith("http") || background.startsWith("data:");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/templates")} className="text-[#857f74] hover:text-[#1c1a17]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent text-lg font-semibold text-[#1c1a17] outline-none border-b border-transparent focus:border-[#c4bbab]"
          />
        </div>
        <button
          onClick={save}
          className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Canvas */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
            <button onClick={() => addZone("text")} className="flex items-center gap-1.5 text-xs border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] px-3 py-1.5 rounded-lg transition-colors">
              <Type className="w-3.5 h-3.5" /> Text
            </button>
            <button onClick={() => addZone("image")} className="flex items-center gap-1.5 text-xs border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] px-3 py-1.5 rounded-lg transition-colors">
              <ImageIcon className="w-3.5 h-3.5" /> Image
            </button>
            <button onClick={() => addZone("logo")} className="flex items-center gap-1.5 text-xs border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] px-3 py-1.5 rounded-lg transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Logo
            </button>
            <button onClick={() => addZone("shape")} className="flex items-center gap-1.5 text-xs border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] px-3 py-1.5 rounded-lg transition-colors">
              <Square className="w-3.5 h-3.5" /> Shape
            </button>
          </div>

          <div
            onPointerDown={() => setSelectedId(null)}
            className="relative overflow-hidden rounded-lg border border-[#c4bbab] select-none"
            style={{
              width: DISPLAY_W,
              height: dispH,
              background: bgIsImage ? "#000" : background,
            }}
          >
            {bgIsImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={background} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}

            {zones.map((z) => {
              const isSel = z.id === selectedId;
              const style: React.CSSProperties = {
                position: "absolute",
                left: `${z.x}%`,
                top: `${z.y}%`,
                width: `${z.w}%`,
                height: `${z.h}%`,
                outline: isSel ? "2px solid #1c1a17" : "1px dashed rgba(255,255,255,0.35)",
                cursor: "move",
              };
              return (
                <div key={z.id} style={style} onPointerDown={(e) => startDrag(e, z, "move")}>
                  {(z.type === "image" || z.type === "logo") &&
                    (z.src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={z.src} alt="" className="w-full h-full" style={{ objectFit: z.objectFit ?? "cover" }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black/20 text-[10px] text-white/70">
                        {z.type === "logo" ? "logo" : "{image}"}
                      </div>
                    ))}

                  {z.type === "shape" && (
                    <div className="w-full h-full" style={{ background: z.fill ?? "#000", opacity: z.opacity ?? 1, borderRadius: z.radius ?? 0 }} />
                  )}

                  {z.type === "text" && (
                    <div
                      className="w-full h-full flex"
                      style={{
                        alignItems: z.valign === "center" ? "center" : z.valign === "bottom" ? "flex-end" : "flex-start",
                        justifyContent: z.align === "center" ? "center" : z.align === "right" ? "flex-end" : "flex-start",
                      }}
                    >
                      <span
                        style={{
                          fontSize: (z.fontSize ?? 48) * scale,
                          fontWeight: z.fontWeight ?? 400,
                          color: z.color ?? "#fff",
                          lineHeight: z.lineHeight ?? 1.1,
                          textAlign: z.align ?? "left",
                          textTransform: z.uppercase ? "uppercase" : "none",
                          width: "100%",
                        }}
                      >
                        {z.text || (z.key ? `{${z.key}}` : "Text")}
                      </span>
                    </div>
                  )}

                  {isSel && (
                    <div
                      onPointerDown={(e) => startDrag(e, z, "resize")}
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#1c1a17] rounded-sm cursor-se-resize"
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Canvas settings */}
          <div className="mt-4 flex items-center gap-3 flex-wrap justify-center">
            <select
              value={`${width}x${height}`}
              onChange={(e) => {
                const s = SIZES.find((s) => `${s.w}x${s.h}` === e.target.value);
                if (s) { setWidth(s.w); setHeight(s.h); }
              }}
              className="bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none"
            >
              {SIZES.map((s) => (
                <option key={s.label} value={`${s.w}x${s.h}`}>{s.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-[#6b655b]">
              Background
              <input type="color" value={bgIsImage ? "#111111" : background} onChange={(e) => setBackground(e.target.value)} className="w-6 h-6 rounded" />
            </label>
            <button onClick={() => bgFileRef.current?.click()} className="flex items-center gap-1.5 text-xs text-[#6b655b] hover:text-[#1c1a17]">
              <Upload className="w-3 h-3" /> bg image
            </button>
            <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={onBgImage} />
          </div>
        </div>

        {/* Properties */}
        <div className="space-y-4">
          {selected ? (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1c1a17] capitalize">{selected.type} zone</p>
                <button onClick={removeSelected} className="text-[#a39c8d] hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* image / logo */}
              {(selected.type === "image" || selected.type === "logo") && (
                <>
                  <button
                    onClick={() => zoneFileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] py-2 rounded-lg text-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {selected.src ? "Replace image" : "Upload image / logo"}
                  </button>
                  <input ref={zoneFileRef} type="file" accept="image/*" className="hidden" onChange={onZoneImage} />
                  {selected.src && (
                    <button onClick={() => update(selected.id, { src: undefined })} className="w-full text-xs text-[#857f74] hover:text-[#1c1a17]">
                      Make dynamic (AI/photo fills it) instead
                    </button>
                  )}
                  <label className="block text-xs text-[#6b655b]">
                    Fit
                    <select
                      value={selected.objectFit ?? "cover"}
                      onChange={(e) => update(selected.id, { objectFit: e.target.value as "cover" | "contain" })}
                      className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none"
                    >
                      <option value="cover">Cover (fill)</option>
                      <option value="contain">Contain (fit, good for logos)</option>
                    </select>
                  </label>
                </>
              )}

              {/* text */}
              {selected.type === "text" && (
                <>
                  <label className="block text-xs text-[#6b655b]">
                    Fills with
                    <select
                      value={selected.text != null && selected.text !== "" ? "static" : selected.key ?? "headline"}
                      onChange={(e) => {
                        if (e.target.value === "static") update(selected.id, { key: undefined, text: selected.text || "Your text" });
                        else update(selected.id, { key: e.target.value, text: "" });
                      }}
                      className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none"
                    >
                      <option value="headline">AI: Headline</option>
                      <option value="body">AI: Body</option>
                      <option value="kicker">AI: Kicker / label</option>
                      <option value="brand">AI: Brand / handle</option>
                      <option value="static">Static text (never changes)</option>
                    </select>
                  </label>
                  {selected.text != null && selected.text !== "" && (
                    <input
                      value={selected.text}
                      onChange={(e) => update(selected.id, { text: e.target.value })}
                      placeholder="Static text"
                      className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none"
                    />
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs text-[#6b655b]">
                      Size
                      <input type="number" value={selected.fontSize ?? 48} onChange={(e) => update(selected.id, { fontSize: Number(e.target.value) })} className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none" />
                    </label>
                    <label className="block text-xs text-[#6b655b]">
                      Weight
                      <select value={selected.fontWeight ?? 400} onChange={(e) => update(selected.id, { fontWeight: Number(e.target.value) })} className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none">
                        <option value={400}>Regular</option>
                        <option value={600}>Semibold</option>
                        <option value={700}>Bold</option>
                        <option value={800}>Extra bold</option>
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-[#6b655b]">
                      Color
                      <input type="color" value={selected.color ?? "#ffffff"} onChange={(e) => update(selected.id, { color: e.target.value })} className="w-6 h-6 rounded" />
                    </label>
                    <select value={selected.align ?? "left"} onChange={(e) => update(selected.id, { align: e.target.value as "left" | "center" | "right" })} className="flex-1 bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none">
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                    <label className="flex items-center gap-1 text-xs text-[#6b655b]">
                      <input type="checkbox" checked={!!selected.uppercase} onChange={(e) => update(selected.id, { uppercase: e.target.checked })} />
                      CAPS
                    </label>
                  </div>
                </>
              )}

              {/* shape */}
              {selected.type === "shape" && (
                <>
                  <label className="flex items-center gap-1.5 text-xs text-[#6b655b]">
                    Fill
                    <input type="color" value={selected.fill ?? "#000000"} onChange={(e) => update(selected.id, { fill: e.target.value })} className="w-6 h-6 rounded" />
                  </label>
                  <label className="block text-xs text-[#6b655b]">
                    Opacity: {Math.round((selected.opacity ?? 1) * 100)}%
                    <input type="range" min={0} max={1} step={0.05} value={selected.opacity ?? 1} onChange={(e) => update(selected.id, { opacity: Number(e.target.value) })} className="w-full" />
                  </label>
                </>
              )}

              {/* position */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#dbd4c7]">
                {(["x", "y", "w", "h"] as const).map((k) => (
                  <label key={k} className="block text-[10px] text-[#857f74] uppercase">
                    {k}
                    <input
                      type="number"
                      value={Math.round(selected[k])}
                      onChange={(e) => update(selected.id, { [k]: clamp(Number(e.target.value), 0, 100) })}
                      className="mt-0.5 w-full bg-[#efeae1] border border-[#d4ccbd] rounded px-1.5 py-1 text-xs text-[#1c1a17] outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 text-xs text-[#857f74]">
              Click a zone to edit it, or add one with the buttons above. Drag to move, drag the
              corner handle to resize.
            </div>
          )}

          {/* AI rules */}
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-[#1c1a17]">AI content rules</p>
            <input
              value={rules.tone ?? ""}
              onChange={(e) => setRules({ ...rules, tone: e.target.value })}
              placeholder="Tone (e.g. urgent, punchy)"
              className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs text-[#6b655b]">
                Headline max words
                <input type="number" value={rules.headlineMaxWords ?? 12} onChange={(e) => setRules({ ...rules, headlineMaxWords: Number(e.target.value) })} className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none" />
              </label>
              <label className="block text-xs text-[#6b655b]">
                Hashtags
                <input type="number" value={rules.hashtagCount ?? 8} onChange={(e) => setRules({ ...rules, hashtagCount: Number(e.target.value) })} className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-2 py-1.5 text-xs text-[#1c1a17] outline-none" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#857f74]">Loading editor…</div>}>
      <EditorInner />
    </Suspense>
  );
}
