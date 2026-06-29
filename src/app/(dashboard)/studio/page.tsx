"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  Upload,
  Wand2,
  Send,
  Clock,
  RefreshCw,
  Newspaper,
  Download,
  Save,
  Shuffle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateCanvas } from "@/components/template/TemplateCanvas";
import { fetchAllTemplates, type ServerTemplate } from "@/lib/templateStore";
import { loadBrand, type BrandKit } from "@/lib/brandStore";
import { saveLibraryItem, downscaleDataUrl } from "@/lib/libraryStore";
import type { TemplateContent } from "@/lib/templates";

interface Account { id: string; platform: string; username: string }

const PLATFORMS = ["instagram", "facebook", "tiktok"];

export default function StudioPage() {
  const [templates, setTemplates] = useState<ServerTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("preset-news");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>(""); // "" = shared
  const [topic, setTopic] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("instagram");

  const [content, setContent] = useState<TemplateContent>({});
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [firstComment, setFirstComment] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");

  const [genText, setGenText] = useState(false);
  const [genImage, setGenImage] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [brand, setBrand] = useState<BrandKit | null>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const [remixing, setRemixing] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkTopics, setBulkTopics] = useState("");
  const [bulkRunning, setBulkRunning] = useState(false);

  useEffect(() => {
    fetchAllTemplates().then(setTemplates);
    fetch("/api/analytics").then((r) => (r.ok ? r.json() : [])).then((d) => setAccounts(Array.isArray(d) ? d : []));
    const b = loadBrand();
    setBrand(b);
    if (b.businessName) setBusinessName(b.businessName);
    if (b.niche) setNiche(b.niche);
    if (b.handle || b.logo) {
      setContent((c) => ({ ...c, brand: b.handle, ...(b.logo ? { logo: b.logo } : {}) }));
    }
  }, []);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? templates[0],
    [templates, templateId]
  );

  // ----- generate post text from the news/topic -----
  const generateText = async () => {
    if (!topic.trim()) return;
    setGenText(true);
    setStatus(null);
    try {
      const res = await fetch("/api/ai/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          businessName,
          niche,
          platform,
          brandVoice: brand?.voice,
          rules: template?.rules,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus(data.error);
        return;
      }
      setContent((c) => ({
        ...c,
        kicker: data.kicker ?? "",
        headline: data.headline ?? "",
        body: data.body ?? "",
        brand: brand?.handle || data.brand || businessName,
      }));
      setCaption(data.caption ?? "");
      setHashtags(data.hashtags ?? []);
      setFirstComment(data.firstComment ?? "");
      setImagePrompt(data.imagePrompt ?? "");
    } catch {
      setStatus("Text generation failed");
    } finally {
      setGenText(false);
    }
  };

  // ----- generate the background image with AI -----
  const generateImage = async () => {
    const prompt = imagePrompt || topic;
    if (!prompt.trim()) return;
    setGenImage(true);
    setStatus(null);
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus(data.error);
        return;
      }
      setContent((c) => ({ ...c, image: data.dataUrl }));
    } catch {
      setStatus("Image generation failed");
    } finally {
      setGenImage(false);
    }
  };

  // ----- or upload your own image -----
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setContent((c) => ({ ...c, image: reader.result as string }));
    reader.readAsDataURL(file);
  };

  // ----- download the composited PNG -----
  const downloadPng = async () => {
    if (!template) return;
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        width: template.width,
        height: template.height,
        background: template.background,
        zones: template.zones,
        content,
      }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "post.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  const publish = async (mode: "now" | "schedule") => {
    setPublishing(true);
    setStatus(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: "demo",
          caption,
          hashtags,
          firstComment,
          template: template
            ? {
                width: template.width,
                height: template.height,
                background: template.background,
                zones: template.zones,
                content,
              }
            : null,
          publishNow: mode === "now",
          source: "news",
          sourceData: topic,
          aiGenerated: true,
        }),
      });
      const data = await res.json();
      if (data.error) setStatus(data.error);
      else setStatus(mode === "now" ? "Published! 🎉" : "Scheduled ✓");
    } catch {
      setStatus("Publishing needs connected accounts + image hosting (see Accounts).");
    } finally {
      setPublishing(false);
    }
  };

  // ----- save the current post to the content library -----
  const saveToLibrary = async () => {
    if (!template) return;
    setStatus(null);
    const slimImage = content.image ? await downscaleDataUrl(content.image, 1080) : undefined;
    await saveLibraryItem({
      name: content.headline || topic.slice(0, 40) || "Untitled post",
      caption,
      hashtags,
      firstComment,
      platform,
      socialAccountId: accountId || null,
      template: {
        width: template.width,
        height: template.height,
        background: template.background,
        zones: template.zones,
      },
      content: { ...content, ...(slimImage ? { image: slimImage } : {}) },
    });
    setStatus("Saved to library ✓");
  };

  // ----- remix the caption into 3 angles -----
  const remixCaption = async () => {
    if (!caption.trim()) return;
    setRemixing(true);
    try {
      const res = await fetch("/api/ai/remix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption, platform, niche }),
      });
      const data = await res.json();
      if (data.variations) setVariations(data.variations);
    } catch {
      /* ignore */
    } finally {
      setRemixing(false);
    }
  };

  // ----- bulk: turn many topics into saved drafts at once -----
  const runBulk = async () => {
    const lines = bulkTopics.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0 || !template) return;
    setBulkRunning(true);
    setStatus(null);
    let saved = 0;
    for (const line of lines) {
      try {
        const res = await fetch("/api/ai/news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: line, businessName, niche, platform, brandVoice: brand?.voice, rules: template.rules }),
        });
        const data = await res.json();
        if (data.error) continue;
        await saveLibraryItem({
          name: data.headline || line.slice(0, 40),
          caption: data.caption ?? "",
          hashtags: data.hashtags ?? [],
          firstComment: data.firstComment ?? "",
          platform,
          socialAccountId: accountId || null,
          template: { width: template.width, height: template.height, background: template.background, zones: template.zones },
          content: {
            kicker: data.kicker ?? "",
            headline: data.headline ?? "",
            body: data.body ?? "",
            brand: brand?.handle ?? "",
            ...(brand?.logo ? { logo: brand.logo } : {}),
          },
        });
        saved++;
      } catch {
        /* skip line */
      }
    }
    setBulkRunning(false);
    setStatus(`Generated ${saved} draft${saved === 1 ? "" : "s"} → saved to Library (add images there or in Studio).`);
    setBulkTopics("");
  };

  const previewWidth = 380;
  const scale = template ? previewWidth / template.width : 0.35;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-[#1c1a17]" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#1c1a17]">News Studio</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">
            Paste a news item → AI writes the post, generates the image, drops it into your template.
          </p>
        </div>
        <button
          onClick={() => setBulkMode((b) => !b)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors",
            bulkMode
              ? "bg-[#1c1a17] text-[#f7f3ec] border-transparent"
              : "border-[#c4bbab] text-[#1c1a17] hover:border-[#1c1a17]/40"
          )}
        >
          <Layers className="w-4 h-4" />
          Bulk mode
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — controls */}
        <div className="space-y-4">
          {/* Template picker */}
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4">
            <p className="text-xs text-[#6b655b] font-medium mb-2">Template</p>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] outline-none focus:border-[#1c1a17]/50"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#f4f1ea]">
                  {t.name}
                  {t.preset ? " (preset)" : ""}
                </option>
              ))}
            </select>
            {template?.rules?.tone && (
              <p className="text-xs text-[#a39c8d] mt-2">
                Rules: {template.rules.tone} · headline ≤{" "}
                {template.rules.headlineMaxWords ?? 12} words ·{" "}
                {template.rules.hashtagCount ?? 8} hashtags
              </p>
            )}
          </div>

          {/* Business context */}
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 grid grid-cols-2 gap-3">
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business name"
              className="bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
            />
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Niche (e.g. tech news)"
              className="bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
            />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="col-span-2 bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] outline-none focus:border-[#1c1a17]/50"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} className="bg-[#f4f1ea]">
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              title="Which account this post is for (controls who on your team sees it)"
              className="col-span-2 bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] outline-none focus:border-[#1c1a17]/50"
            >
              <option value="">For: Shared (whole team)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>For: @{a.username}</option>
              ))}
            </select>
          </div>

          {/* Bulk panel */}
          {bulkMode && (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4">
              <p className="text-xs text-[#6b655b] font-medium mb-2">Bulk topics — one per line</p>
              <textarea
                value={bulkTopics}
                onChange={(e) => setBulkTopics(e.target.value)}
                rows={6}
                placeholder={"New product launch this week\nIndustry award we just won\nWeekend sale announcement"}
                className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] resize-none outline-none focus:border-[#1c1a17]/50"
              />
              <button
                onClick={runBulk}
                disabled={bulkRunning || !bulkTopics.trim()}
                className="mt-3 w-full bg-[#1c1a17] hover:bg-[#000000] disabled:opacity-50 text-[#f7f3ec] py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {bulkRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                {bulkRunning ? "Generating drafts…" : "Generate all → Library"}
              </button>
              <p className="text-xs text-[#a39c8d] mt-2">
                Each line becomes a draft (text only, to save cost) in your Library. Add images there.
              </p>
            </div>
          )}

          {/* News input */}
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4">
            <p className="text-xs text-[#6b655b] font-medium mb-2">News item or topic</p>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Paste a headline or article, or describe what happened…"
              rows={4}
              className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] resize-none outline-none focus:border-[#1c1a17]/50"
            />
            <button
              onClick={generateText}
              disabled={genText || !topic.trim()}
              className="mt-3 w-full bg-[#1c1a17] hover:bg-[#000000] disabled:opacity-50 text-[#f7f3ec] py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {genText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {genText ? "Writing post…" : "Generate post text"}
            </button>
          </div>

          {/* Image controls */}
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 space-y-3">
            <p className="text-xs text-[#6b655b] font-medium">Image</p>
            {imagePrompt && (
              <input
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Image prompt"
                className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-xs text-[#3c372f] outline-none focus:border-[#1c1a17]/50"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={generateImage}
                disabled={genImage}
                className="flex-1 bg-[#1c1a17]/20 hover:bg-[#1c1a17]/30 border border-[#1c1a17]/30 text-[#46413a] py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {genImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {genImage ? "Generating…" : "Generate image (AI)"}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 border border-[#d4ccbd] hover:border-[#c4bbab] text-[#3c372f] py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload image
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </div>

          {/* Editable text fields */}
          {(content.headline || content.kicker) && (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 space-y-2">
              <p className="text-xs text-[#6b655b] font-medium mb-1">Fine-tune text</p>
              {["kicker", "headline", "body", "brand"].map((k) =>
                template?.zones.some((z) => z.key === k) ? (
                  <input
                    key={k}
                    value={content[k] ?? ""}
                    onChange={(e) => setContent((c) => ({ ...c, [k]: e.target.value }))}
                    placeholder={k}
                    className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-1.5 text-xs text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
                  />
                ) : null
              )}
            </div>
          )}
        </div>

        {/* RIGHT — live preview + publish */}
        <div className="space-y-4">
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[#6b655b] font-medium">Live preview</p>
              <div className="flex gap-2">
                <button onClick={generateImage} disabled={genImage} className="text-[#857f74] hover:text-[#1c1a17] transition-colors" title="Regenerate image">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={downloadPng} className="text-[#857f74] hover:text-[#1c1a17] transition-colors" title="Download PNG">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              {template && (
                <div
                  style={{ width: previewWidth, height: template.height * scale }}
                  className="rounded-lg overflow-hidden border border-[#d4ccbd]"
                >
                  <TemplateCanvas
                    width={template.width}
                    height={template.height}
                    background={template.background}
                    zones={template.zones}
                    content={content}
                    scale={scale}
                  />
                </div>
              )}
            </div>
            {!content.image && !content.headline && (
              <p className="text-center text-xs text-[#a39c8d] mt-3">
                Generate text and an image to see your post come together
              </p>
            )}
          </div>

          {/* Caption + publish */}
          {caption && (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-[#6b655b] font-medium mb-1.5">Caption</p>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-xs text-[#1c1a17] resize-none outline-none focus:border-[#1c1a17]/50"
                />
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-[#1c1a17]/20 text-[#46413a] rounded-full">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={remixCaption}
                disabled={remixing}
                className="flex items-center gap-1.5 text-xs text-[#1c1a17] hover:text-[#000] border border-[#c4bbab] hover:border-[#1c1a17]/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {remixing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
                Remix caption
              </button>

              {variations.length > 0 && (
                <div className="space-y-1.5">
                  {variations.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => { setCaption(v); setVariations([]); }}
                      className="w-full text-left text-xs text-[#3c372f] bg-[#efeae1] hover:bg-[#e8e1d4] border border-[#dbd4c7] rounded-lg p-2.5 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => publish("now")}
              disabled={publishing || !content.image}
              className="flex-1 bg-[#1c1a17] hover:bg-[#000000] disabled:opacity-50 text-[#f7f3ec] py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post now
            </button>
            <button
              onClick={saveToLibrary}
              disabled={!caption && !content.headline}
              className="flex-1 border border-[#d4ccbd] hover:border-[#c4bbab] disabled:opacity-50 text-[#1c1a17] py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save to library
            </button>
          </div>

          <button
            onClick={() => publish("schedule")}
            disabled={publishing || !content.image}
            className="w-full border border-[#d4ccbd] hover:border-[#c4bbab] disabled:opacity-50 text-[#1c1a17] py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Schedule (auto-publish)
          </button>

          {status && (
            <div className="bg-[#efeae1] border border-[#dbd4c7] rounded-lg px-4 py-2.5 text-xs text-[#3c372f]">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
