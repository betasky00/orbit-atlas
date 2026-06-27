"use client";

import { useState } from "react";
import { Sparkles, Clock, FileText, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "post" | "bio" | "times";

const TOOLS: { id: Tool; label: string; icon: typeof Sparkles; description: string }[] = [
  { id: "post", label: "Caption Generator", icon: Sparkles, description: "Generate captions, hashtags & first comments" },
  { id: "bio", label: "Bio Writer", icon: FileText, description: "Write optimized bios for any platform" },
  { id: "times", label: "Best Post Times", icon: Clock, description: "AI-powered posting schedule recommendations" },
];

const PLATFORMS = ["instagram", "facebook", "tiktok"];

export default function AIPage() {
  const [tool, setTool] = useState<Tool>("post");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    niche: "",
    platform: "instagram",
    mediaDescription: "",
    keyPoints: "",
    tone: "inspirational",
    timezone: "Europe/Paris",
  });

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tool, ...form }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ error: "Generation failed" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1c1a17]">AI Tools</h1>
        <p className="text-[#6b655b] text-sm mt-0.5">
          Let AI handle captions, bios, hashtags, and timing
        </p>
      </div>

      {/* Tool selector */}
      <div className="grid grid-cols-3 gap-3">
        {TOOLS.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => { setTool(id); setResult(null); }}
            className={cn(
              "p-4 rounded-xl border text-left transition-all",
              tool === id
                ? "bg-[#1c1a17]/10 border-[#1c1a17]/40"
                : "bg-[#f4f1ea] border-[#dbd4c7] hover:border-[#d4ccbd]"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-2", tool === id ? "text-[#1c1a17]" : "text-[#857f74]")} />
            <p className={cn("text-sm font-medium", tool === id ? "text-[#1c1a17]" : "text-[#3c372f]")}>{label}</p>
            <p className="text-xs text-[#857f74] mt-0.5">{description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1c1a17]">Input</h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#6b655b] block mb-1.5">Business Name</label>
              <input
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                placeholder="e.g. Luxe Gardens Paris"
                className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
              />
            </div>

            <div>
              <label className="text-xs text-[#6b655b] block mb-1.5">Niche / Industry</label>
              <input
                value={form.niche}
                onChange={(e) => setForm({ ...form, niche: e.target.value })}
                placeholder="e.g. luxury landscaping, fashion, real estate"
                className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
              />
            </div>

            <div>
              <label className="text-xs text-[#6b655b] block mb-1.5">Platform</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] outline-none focus:border-[#1c1a17]/50"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p} className="bg-[#f4f1ea]">
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {tool === "post" && (
              <div>
                <label className="text-xs text-[#6b655b] block mb-1.5">Describe the post</label>
                <textarea
                  value={form.mediaDescription}
                  onChange={(e) => setForm({ ...form, mediaDescription: e.target.value })}
                  placeholder="e.g. Before/after of a rooftop garden installation with Japanese zen elements"
                  rows={3}
                  className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] resize-none outline-none focus:border-[#1c1a17]/50"
                />
              </div>
            )}

            {tool === "bio" && (
              <div>
                <label className="text-xs text-[#6b655b] block mb-1.5">Key points to include</label>
                <textarea
                  value={form.keyPoints}
                  onChange={(e) => setForm({ ...form, keyPoints: e.target.value })}
                  placeholder="e.g. 10 years experience, Paris-based, luxury projects only, book a consultation"
                  rows={3}
                  className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] resize-none outline-none focus:border-[#1c1a17]/50"
                />
              </div>
            )}

            {tool === "times" && (
              <div>
                <label className="text-xs text-[#6b655b] block mb-1.5">Timezone</label>
                <input
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  placeholder="e.g. Europe/Paris"
                  className="w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !form.businessName || !form.niche}
            className="w-full bg-[#1c1a17] hover:bg-[#000000] disabled:opacity-50 text-[#f7f3ec] py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>

        {/* Result */}
        <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1c1a17]">Result</h2>
            {result && !("error" in result) && (
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="flex items-center gap-1 text-xs text-[#857f74] hover:text-[#1c1a17] transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          {!result && !loading && (
            <div className="h-48 flex items-center justify-center">
              <p className="text-xs text-[#a39c8d]">Results will appear here</p>
            </div>
          )}

          {loading && (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#1c1a17] animate-spin" />
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4 text-sm">
              {tool === "post" && (
                <>
                  {result.caption && (
                    <div>
                      <p className="text-xs text-[#857f74] mb-1.5">Caption</p>
                      <p className="text-[#2a2722] bg-[#efeae1] rounded-lg p-3 text-xs leading-relaxed">
                        {result.caption as string}
                      </p>
                    </div>
                  )}
                  {Array.isArray(result.hashtags) && result.hashtags.length > 0 && (
                    <div>
                      <p className="text-xs text-[#857f74] mb-1.5">Hashtags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(result.hashtags as string[]).map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 bg-[#1c1a17]/20 text-[#46413a] rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.firstComment && (
                    <div>
                      <p className="text-xs text-[#857f74] mb-1.5">First Comment</p>
                      <p className="text-[#2a2722] bg-[#efeae1] rounded-lg p-3 text-xs leading-relaxed">
                        {result.firstComment as string}
                      </p>
                    </div>
                  )}
                </>
              )}

              {tool === "bio" && (
                <>
                  {result.bio && (
                    <div>
                      <p className="text-xs text-[#857f74] mb-1.5">Primary Bio</p>
                      <p className="text-[#2a2722] bg-[#efeae1] rounded-lg p-3 text-xs leading-relaxed">
                        {result.bio as string}
                      </p>
                    </div>
                  )}
                  {Array.isArray(result.alternatives) && (
                    <div>
                      <p className="text-xs text-[#857f74] mb-1.5">Alternatives</p>
                      <div className="space-y-2">
                        {(result.alternatives as string[]).map((alt, i) => (
                          <p key={i} className="text-[#3c372f] bg-[#efeae1] rounded-lg p-3 text-xs leading-relaxed">
                            {alt}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {tool === "times" && Array.isArray((result as { times?: unknown[] }).times) && (
                <div className="space-y-2">
                  {((result as { times: { day: string; time: string; reason: string }[] }).times).map((slot, i) => (
                    <div key={i} className="flex items-start gap-3 bg-[#efeae1] rounded-lg p-3">
                      <div className="text-xs text-[#46413a] font-medium w-28 flex-shrink-0">
                        {slot.day} · {slot.time}
                      </div>
                      <p className="text-xs text-[#6b655b]">{slot.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {"error" in result && (
                <p className="text-red-600 text-xs">{result.error as string}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
