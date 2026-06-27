"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Upload,
  Wand2,
  Send,
  Clock,
  RefreshCw,
  Newspaper,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateCanvas } from "@/components/template/TemplateCanvas";
import { allTemplates } from "@/lib/templateStore";
import type { TemplateDef, TemplateContent } from "@/lib/templates";

const PLATFORMS = ["instagram", "facebook", "tiktok"];

export default function StudioPage() {
  const [templates, setTemplates] = useState<TemplateDef[]>([]);
  const [templateId, setTemplateId] = useState<string>("preset-news");
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

  useEffect(() => {
    setTemplates(allTemplates());
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
        brand: data.brand || businessName,
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

  const previewWidth = 380;
  const scale = template ? previewWidth / template.width : 0.35;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-2">
        <Newspaper className="w-5 h-5 text-violet-400" />
        <div>
          <h1 className="text-2xl font-semibold text-white">News Studio</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Paste a news item → AI writes the post, generates the image, drops it into your template. Post instantly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — controls */}
        <div className="space-y-4">
          {/* Template picker */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-2">Template</p>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-600/50"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#111]">
                  {t.name}
                  {t.preset ? " (preset)" : ""}
                </option>
              ))}
            </select>
            {template?.rules?.tone && (
              <p className="text-xs text-gray-600 mt-2">
                Rules: {template.rules.tone} · headline ≤{" "}
                {template.rules.headlineMaxWords ?? 12} words ·{" "}
                {template.rules.hashtagCount ?? 8} hashtags
              </p>
            )}
          </div>

          {/* Business context */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 grid grid-cols-2 gap-3">
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business name"
              className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-600/50"
            />
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Niche (e.g. tech news)"
              className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-600/50"
            />
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="col-span-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-600/50"
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} className="bg-[#111]">
                  {p[0].toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* News input */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-2">News item or topic</p>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Paste a headline or article, or describe what happened…"
              rows={4}
              className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 resize-none outline-none focus:border-violet-600/50"
            />
            <button
              onClick={generateText}
              disabled={genText || !topic.trim()}
              className="mt-3 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {genText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {genText ? "Writing post…" : "Generate post text"}
            </button>
          </div>

          {/* Image controls */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-400 font-medium">Image</p>
            {imagePrompt && (
              <input
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Image prompt"
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-violet-600/50"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={generateImage}
                disabled={genImage}
                className="flex-1 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 text-violet-300 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {genImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {genImage ? "Generating…" : "Generate image (AI)"}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 border border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-300 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload image
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          </div>

          {/* Editable text fields */}
          {(content.headline || content.kicker) && (
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-400 font-medium mb-1">Fine-tune text</p>
              {["kicker", "headline", "body", "brand"].map((k) =>
                template?.zones.some((z) => z.key === k) ? (
                  <input
                    key={k}
                    value={content[k] ?? ""}
                    onChange={(e) => setContent((c) => ({ ...c, [k]: e.target.value }))}
                    placeholder={k}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-violet-600/50"
                  />
                ) : null
              )}
            </div>
          )}
        </div>

        {/* RIGHT — live preview + publish */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium">Live preview</p>
              <div className="flex gap-2">
                <button onClick={generateImage} disabled={genImage} className="text-gray-500 hover:text-white transition-colors" title="Regenerate image">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={downloadPng} className="text-gray-500 hover:text-white transition-colors" title="Download PNG">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              {template && (
                <div
                  style={{ width: previewWidth, height: template.height * scale }}
                  className="rounded-lg overflow-hidden border border-[#2a2a2a]"
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
              <p className="text-center text-xs text-gray-600 mt-3">
                Generate text and an image to see your post come together
              </p>
            )}
          </div>

          {/* Caption + publish */}
          {caption && (
            <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1.5">Caption</p>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white resize-none outline-none focus:border-violet-600/50"
                />
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-violet-600/20 text-violet-300 rounded-full">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => publish("now")}
              disabled={publishing || !content.image}
              className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post now
            </button>
            <button
              onClick={() => publish("schedule")}
              disabled={publishing || !content.image}
              className="flex-1 border border-[#2a2a2a] hover:border-[#3a3a3a] disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Schedule
            </button>
          </div>

          {status && (
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-4 py-2.5 text-xs text-gray-300">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
