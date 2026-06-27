"use client";

import { useRef, useState } from "react";
import {
  Film,
  Upload,
  Loader2,
  Music,
  Zap,
  Scissors,
  Type,
  Download,
  Save,
  Clock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReelBlueprint, ReelShot } from "@/lib/reels";

const FRAME_COUNT = 16;

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = Math.min(t, video.duration || t);
  });
}

async function extractFrames(file: File): Promise<{
  frames: { time: number; dataUrl: string }[];
  duration: number;
  aspectRatio: string;
}> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not read video"));
  });

  const duration = video.duration || 0;
  const w = video.videoWidth || 1080;
  const h = video.videoHeight || 1920;
  const aspectRatio = `${w}:${h}`;

  const scale = 512 / Math.max(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;

  const frames: { time: number; dataUrl: string }[] = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const t = (i / (FRAME_COUNT - 1)) * Math.max(duration - 0.05, 0);
    await seek(video, t);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push({ time: t, dataUrl: canvas.toDataURL("image/jpeg", 0.6) });
  }

  URL.revokeObjectURL(url);
  return { frames, duration, aspectRatio: simplifyRatio(w, h) || aspectRatio };
}

function simplifyRatio(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

function TransitionBadge({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#1c1a17]/[0.07] text-[#6b655b] border border-[#dbd4c7]">
      {label}
    </span>
  );
}

export default function ReelsPage() {
  const [stage, setStage] = useState<"idle" | "extracting" | "analyzing">("idle");
  const [frames, setFrames] = useState<{ time: number; dataUrl: string }[]>([]);
  const [blueprint, setBlueprint] = useState<ReelBlueprint | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const slotRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const onVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBlueprint(null);
    try {
      setStage("extracting");
      const { frames, duration, aspectRatio } = await extractFrames(file);
      setFrames(frames);

      setStage("analyzing");
      const res = await fetch("/api/reels/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames, duration, aspectRatio, sourceName: file.name }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setBlueprint(data);
      setName(file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process video");
    } finally {
      setStage("idle");
    }
  };

  const setShotMedia = (index: number, dataUrl: string, type: "image" | "video") => {
    setBlueprint((bp) =>
      bp
        ? {
            ...bp,
            shots: bp.shots.map((s) =>
              s.index === index ? { ...s, userMedia: dataUrl, userMediaType: type } : s
            ),
          }
        : bp
    );
  };

  const onSlotFile = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setShotMedia(index, reader.result as string, file.type.startsWith("video") ? "video" : "image");
    reader.readAsDataURL(file);
  };

  const saveReel = () => {
    if (!blueprint) return;
    const saved = JSON.parse(localStorage.getItem("orbit.reels") || "[]");
    saved.push({ ...blueprint, id: `reel-${Date.now()}`, name: name || "My Reel", createdAt: Date.now() });
    localStorage.setItem("orbit.reels", JSON.stringify(saved));
    setError(null);
    alert("Reel template saved.");
  };

  const exportShotList = () => {
    if (!blueprint) return;
    const lines: string[] = [];
    lines.push(`# Reel Recipe — ${name || "Untitled"}`);
    lines.push("");
    lines.push(`- Duration: ${blueprint.totalDuration?.toFixed(1)}s`);
    lines.push(`- Aspect: ${blueprint.aspectRatio}`);
    lines.push(`- Pacing: ${blueprint.pacing}`);
    lines.push(`- Music vibe: ${blueprint.musicVibe}${blueprint.bpmGuess ? ` (~${blueprint.bpmGuess} BPM)` : ""}`);
    lines.push(`- Hook: ${blueprint.hook}`);
    lines.push("");
    lines.push(`## Shots`);
    blueprint.shots.forEach((s) => {
      lines.push("");
      lines.push(`### Shot ${s.index + 1} — ${s.start.toFixed(1)}s → ${s.end.toFixed(1)}s (${s.duration.toFixed(1)}s)`);
      lines.push(`- Film: ${s.description}`);
      if (s.onScreenText) lines.push(`- On-screen text (${s.textPosition ?? "center"}): "${s.onScreenText}"`);
      lines.push(`- Transition in: ${s.transitionIn ?? "cut"} · out: ${s.transitionOut ?? "cut"}`);
      if (s.cameraMove) lines.push(`- Camera: ${s.cameraMove}`);
      lines.push(`- Your clip: ${s.userMedia ? "assigned ✓" : "— (add your footage)"}`);
    });
    if (blueprint.editingNotes?.length) {
      lines.push("");
      lines.push(`## Editing notes`);
      blueprint.editingNotes.forEach((n) => lines.push(`- ${n}`));
    }
    if (blueprint.caption) {
      lines.push("");
      lines.push(`## Caption`);
      lines.push(blueprint.caption);
      if (blueprint.hashtags?.length) lines.push("", blueprint.hashtags.map((h) => `#${h}`).join(" "));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name || "reel"}-recipe.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const busy = stage !== "idle";
  const assigned = blueprint?.shots.filter((s) => s.userMedia).length ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Film className="w-5 h-5 text-[#1c1a17]" />
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Reel Remix</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">
            Upload a reel you love. AI breaks down its cuts, text, transitions, pacing and music — then you drop in your own footage to recreate the edit.
          </p>
        </div>
      </div>

      {/* Upload */}
      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5">
        <div className="flex items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this remix (optional)"
            className="flex-1 bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] disabled:opacity-50 text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {stage === "extracting" ? "Reading video…" : stage === "analyzing" ? "Analyzing edit…" : "Upload reel"}
          </button>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onVideo} />
        </div>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
        {stage === "analyzing" && (
          <div className="flex items-center gap-2 text-sm text-[#6b655b] mt-3">
            <Scissors className="w-4 h-4 animate-pulse" />
            Detecting cuts, on-screen text, transitions and pacing…
          </div>
        )}

        {frames.length > 0 && (
          <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
            {frames.map((f, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={f.dataUrl}
                alt={`${f.time.toFixed(1)}s`}
                className="h-20 rounded-md border border-[#dbd4c7] flex-shrink-0"
              />
            ))}
          </div>
        )}
      </div>

      {blueprint && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Clock, label: "Duration", value: `${blueprint.totalDuration?.toFixed(1)}s` },
              { icon: Zap, label: "Pacing", value: blueprint.pacing },
              { icon: Scissors, label: "Shots", value: String(blueprint.shots.length) },
              { icon: Music, label: "Music vibe", value: blueprint.bpmGuess ? `~${blueprint.bpmGuess} BPM` : "—" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-[#857f74] mb-1">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs">{label}</span>
                </div>
                <p className="text-base font-semibold text-[#1c1a17] capitalize">{value}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 space-y-2">
            <p className="text-sm text-[#1c1a17]">
              <span className="font-medium">Hook:</span> {blueprint.hook}
            </p>
            <p className="text-sm text-[#3c372f]">
              <span className="font-medium">Music:</span> {blueprint.musicVibe}
            </p>
          </div>

          {/* Shots */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#1c1a17]">
                Shot list — replace each with your footage{" "}
                <span className="text-[#857f74] font-normal">({assigned}/{blueprint.shots.length} assigned)</span>
              </h2>
            </div>
            <div className="space-y-3">
              {blueprint.shots.map((shot: ReelShot) => (
                <div key={shot.index} className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 flex gap-4">
                  {/* timing column */}
                  <div className="flex flex-col items-center justify-center w-14 flex-shrink-0">
                    <span className="text-lg font-semibold text-[#1c1a17]">{shot.index + 1}</span>
                    <span className="text-[10px] text-[#857f74]">{shot.duration.toFixed(1)}s</span>
                  </div>

                  {/* details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-[#857f74]">
                        {shot.start.toFixed(1)}s → {shot.end.toFixed(1)}s
                      </span>
                      <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#1c1a17]/[0.07] text-[#6b655b] border border-[#dbd4c7] capitalize">
                        {shot.kind}
                      </span>
                      <TransitionBadge label={shot.transitionIn ? `in: ${shot.transitionIn}` : undefined} />
                      <TransitionBadge label={shot.transitionOut ? `out: ${shot.transitionOut}` : undefined} />
                    </div>
                    <p className="text-sm text-[#1c1a17]">{shot.description}</p>
                    {shot.onScreenText && (
                      <p className="text-xs text-[#3c372f] flex items-center gap-1.5">
                        <Type className="w-3 h-3" />
                        <span className="font-medium">{shot.textPosition ?? "center"}:</span> “{shot.onScreenText}”
                      </p>
                    )}
                    {shot.cameraMove && (
                      <p className="text-xs text-[#857f74]">Camera: {shot.cameraMove}</p>
                    )}
                  </div>

                  {/* replace slot */}
                  <div className="w-28 flex-shrink-0">
                    <input
                      ref={(el) => {
                        slotRefs.current[shot.index] = el;
                      }}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => onSlotFile(shot.index, e)}
                    />
                    <button
                      onClick={() => slotRefs.current[shot.index]?.click()}
                      className={cn(
                        "w-28 rounded-lg border overflow-hidden flex items-center justify-center transition-colors",
                        shot.userMedia
                          ? "border-[#dbd4c7]"
                          : "border-dashed border-[#c4bbab] hover:border-[#1c1a17]/40 bg-[#efeae1]"
                      )}
                      style={{ aspectRatio: "9 / 16" }}
                    >
                      {shot.userMedia ? (
                        shot.userMediaType === "video" ? (
                          <video src={shot.userMedia} className="w-full h-full object-cover" muted />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={shot.userMedia} alt="" className="w-full h-full object-cover" />
                        )
                      ) : (
                        <span className="text-[10px] text-[#857f74] flex flex-col items-center gap-1">
                          <Upload className="w-4 h-4" />
                          Add clip
                        </span>
                      )}
                    </button>
                    {shot.userMedia && (
                      <button
                        onClick={() => slotRefs.current[shot.index]?.click()}
                        className="w-full mt-1 text-[10px] text-[#857f74] hover:text-[#1c1a17] flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> swap
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editing notes */}
          {blueprint.editingNotes && blueprint.editingNotes.length > 0 && (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4">
              <p className="text-sm font-semibold text-[#1c1a17] mb-2">Editing notes</p>
              <ul className="space-y-1.5">
                {blueprint.editingNotes.map((note, i) => (
                  <li key={i} className="text-xs text-[#3c372f] flex gap-2">
                    <span className="text-[#a39c8d]">•</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Caption */}
          {blueprint.caption && (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4">
              <p className="text-sm font-semibold text-[#1c1a17] mb-2">Suggested caption</p>
              <p className="text-sm text-[#3c372f]">{blueprint.caption}</p>
              {blueprint.hashtags && blueprint.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {blueprint.hashtags.map((h, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-[#1c1a17]/[0.07] text-[#46413a] rounded-full">
                      #{h}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={saveReel}
              className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Save as reel template
            </button>
            <button
              onClick={exportShotList}
              className="flex items-center gap-2 border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export shot list
            </button>
          </div>

          <p className="text-xs text-[#857f74]">
            Your clips stay in your browser. Export the shot list to assemble the final video in your editor (CapCut, Premiere) — one-click auto-render is coming next.
          </p>
        </>
      )}
    </div>
  );
}
