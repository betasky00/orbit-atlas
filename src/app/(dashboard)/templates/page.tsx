"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, Upload, Sparkles, Trash2, Plus, LayoutTemplate, Check, Pencil } from "lucide-react";
import { TemplateCanvas } from "@/components/template/TemplateCanvas";
import { fetchAllTemplates, saveTemplate, deleteTemplate, type ServerTemplate } from "@/lib/templateStore";
import type { TemplateDef } from "@/lib/templates";

interface Account { id: string; platform: string; username: string }

const SAMPLE_CONTENT = {
  kicker: "BREAKING",
  headline: "Your headline appears right here",
  body: "Supporting line of text",
  brand: "@yourbrand",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ServerTemplate[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>(""); // "" = shared
  const [analyzing, setAnalyzing] = useState(false);
  const [draft, setDraft] = useState<TemplateDef | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => setTemplates(await fetchAllTemplates());
  useEffect(() => {
    refresh();
    fetch("/api/analytics").then((r) => (r.ok ? r.json() : [])).then((d) => setAccounts(Array.isArray(d) ? d : []));
  }, []);

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
          background: data.background ?? "#f4f1ea",
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

  const saveDraft = async () => {
    if (!draft) return;
    await saveTemplate({ ...draft, name: name || draft.name }, accountId || null);
    setDraft(null);
    setName("");
    refresh();
  };

  const remove = async (id: string) => {
    await deleteTemplate(id);
    refresh();
  };

  const isPreset = (id: string) => id.startsWith("preset-");

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="w-5 h-5 text-[#1c1a17]" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Templates</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">
            Upload an example for AI to learn, or build one from scratch in the editor.
          </p>
        </div>
        <Link
          href="/templates/editor"
          className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New template
        </Link>
      </div>

      {/* Upload / analyze */}
      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name (e.g. Daily News Card)"
            className="flex-1 bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
          />
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            title="Which account can see this template"
            className="bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] outline-none focus:border-[#1c1a17]/50"
          >
            <option value="">Shared (everyone)</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>@{a.username}</option>
            ))}
          </select>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={analyzing}
            className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] disabled:opacity-50 text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {analyzing ? "Analyzing…" : "Upload example post"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}

        {analyzing && (
          <div className="flex items-center gap-2 text-sm text-[#6b655b]">
            <Sparkles className="w-4 h-4 text-[#1c1a17] animate-pulse" />
            AI is studying the layout, zones, and content rules…
          </div>
        )}

        {draft && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            <div>
              <p className="text-xs text-[#6b655b] mb-2">Detected template</p>
              <div className="flex justify-center bg-[#efeae1] rounded-lg p-4">
                <div
                  style={{ width: 240, height: (draft.height / draft.width) * 240 }}
                  className="rounded-md overflow-hidden border border-[#d4ccbd]"
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
                <p className="text-xs text-[#6b655b] mb-1">Detected rules</p>
                <div className="bg-[#efeae1] rounded-lg p-3 text-xs text-[#3c372f] space-y-1">
                  <p>Tone: {draft.rules?.tone ?? "—"}</p>
                  <p>Headline max: {draft.rules?.headlineMaxWords ?? "—"} words</p>
                  <p>Hashtags: {draft.rules?.hashtagCount ?? "—"}</p>
                  <p>Zones detected: {draft.zones.length}</p>
                </div>
              </div>
              <button
                onClick={saveDraft}
                className="w-full bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save template
              </button>
              <button
                onClick={() => setDraft(null)}
                className="w-full text-[#6b655b] hover:text-[#1c1a17] py-2 rounded-lg text-sm transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Template gallery */}
      <div>
        <h2 className="text-sm font-semibold text-[#1c1a17] mb-3">Your templates</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl overflow-hidden group">
              <div className="bg-[#efeae1] p-3 flex justify-center">
                <div
                  style={{ width: 180, height: (t.height / t.width) * 180 }}
                  className="rounded-md overflow-hidden border border-[#d4ccbd]"
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
              <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm text-[#1c1a17] truncate">{t.name}</p>
                  <p className="text-xs text-[#857f74] truncate">
                    {t.preset
                      ? "Preset"
                      : t.socialAccountId
                      ? `@${accounts.find((a) => a.id === t.socialAccountId)?.username ?? "account"}`
                      : "Shared"}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/templates/editor?id=${t.id}`}
                    className="text-[#857f74] hover:text-[#1c1a17] transition-colors"
                    title={t.preset ? "Edit a copy" : "Edit"}
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  {!isPreset(t.id) && (
                    <button
                      onClick={() => remove(t.id)}
                      className="text-[#a39c8d] hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
