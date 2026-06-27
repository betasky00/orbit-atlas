"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Upload, Sparkles, Trash2, Plus, LayoutTemplate, Check } from "lucide-react";
import { TemplateCanvas } from "@/components/template/TemplateCanvas";
import {
  allTemplates,
  saveUserTemplate,
  deleteUserTemplate,
  loadUserTemplates,
} from "@/lib/templateStore";
import type { TemplateDef } from "@/lib/templates";

const SAMPLE_CONTENT = {
  kicker: "BREAKING",
  headline: "Your headline appears right here",
  body: "Supporting line of text",
  brand: "@yourbrand",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateDef[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [draft, setDraft] = useState<TemplateDef | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setTemplates(allTemplates());
  useEffect(refresh, []);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAnalyzing(true);
      try {
        const res = await fetch("/api/templates/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: dataUrl, name: name || "My Template" }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          return;
        }
        setDraft({
          id: `tpl-${Date.now()}`,
          name: name || "My Template",
          postType: data.postType,
          width: data.width ?? 1080,
          height: data.height ?? 1080,
          background: data.background ?? "#111111",
          zones: data.zones ?? [],
          rules: data.rules,
          sampleImage: dataUrl,
        });
      } catch {
        setError("Analysis failed — check your OpenAI key");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveDraft = () => {
    if (!draft) return;
    saveUserTemplate({ ...draft, name: name || draft.name });
    setDraft(null);
    setName("");
    refresh();
  };

  const remove = (id: string) => {
    deleteUserTemplate(id);
    refresh();
  };

  const userIds = new Set(loadUserTemplates().map((t) => t.id));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="w-5 h-5 text-violet-400" />
        <div>
          <h1 className="text-2xl font-semibold text-white">Templates</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Upload an example post and AI learns its layout + rules — then reuse it forever.
          </p>
        </div>
      </div>

      {/* Upload / analyze */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name (e.g. Daily News Card)"
            className="flex-1 bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-600/50"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={analyzing}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {analyzing ? "Analyzing…" : "Upload example post"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}

        {analyzing && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
            AI is studying the layout, zones, and content rules…
          </div>
        )}

        {draft && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <div>
              <p className="text-xs text-gray-400 mb-2">Detected template</p>
              <div className="flex justify-center bg-[#0d0d0d] rounded-lg p-4">
                <div
                  style={{ width: 240, height: (draft.height / draft.width) * 240 }}
                  className="rounded-md overflow-hidden border border-[#2a2a2a]"
                >
                  <TemplateCanvas
                    width={draft.width}
                    height={draft.height}
                    background={draft.background}
                    zones={draft.zones}
                    content={SAMPLE_CONTENT}
                    scale={240 / draft.width}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Detected rules</p>
                <div className="bg-[#0d0d0d] rounded-lg p-3 text-xs text-gray-300 space-y-1">
                  <p>Tone: {draft.rules?.tone ?? "—"}</p>
                  <p>Headline max: {draft.rules?.headlineMaxWords ?? "—"} words</p>
                  <p>Hashtags: {draft.rules?.hashtagCount ?? "—"}</p>
                  <p>Zones detected: {draft.zones.length}</p>
                </div>
              </div>
              <button
                onClick={saveDraft}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save template
              </button>
              <button
                onClick={() => setDraft(null)}
                className="w-full text-gray-400 hover:text-white py-2 rounded-lg text-sm transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Template gallery */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Your templates</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden group">
              <div className="bg-[#0d0d0d] p-3 flex justify-center">
                <div
                  style={{ width: 180, height: (t.height / t.width) * 180 }}
                  className="rounded-md overflow-hidden border border-[#2a2a2a]"
                >
                  <TemplateCanvas
                    width={t.width}
                    height={t.height}
                    background={t.background}
                    zones={t.zones}
                    content={SAMPLE_CONTENT}
                    scale={180 / t.width}
                  />
                </div>
              </div>
              <div className="px-3 py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.preset ? "Preset" : t.postType ?? "Custom"}</p>
                </div>
                {userIds.has(t.id) && (
                  <button
                    onClick={() => remove(t.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
