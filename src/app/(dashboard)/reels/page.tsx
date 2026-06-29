"use client";

import { useRef, useState } from "react";
import {
  Film,
  Upload,
  Loader2,
  Sparkles,
  Scissors,
  Type,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Music,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers (module scope)
// ---------------------------------------------------------------------------

interface Shot {
  id: string;
  start: number;
  end: number;
  duration: number;
  thumb: string; // representative frame data URL
  description?: string;
  onScreenText?: string | null;
  text?: string; // overlay text the user wants burned in
  asset?: string; // data URL of replacement image/video
  assetType?: "image" | "video";
}

function seek(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    const on = () => {
      video.removeEventListener("seeked", on);
      resolve();
    };
    video.addEventListener("seeked", on);
    video.currentTime = Math.min(t, (video.duration || t) - 0.001);
  });
}

// Average grayscale signature of the current canvas (small = fast).
function signature(ctx: CanvasRenderingContext2D, w: number, h: number): Float32Array {
  const { data } = ctx.getImageData(0, 0, w, h);
  const sig = new Float32Array(w * h);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    sig[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sig;
}

function meanAbsDiff(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length / 255; // 0..1
}

// Detect cut timestamps by diffing every actually-rendered frame.
async function detectCuts(
  video: HTMLVideoElement,
  threshold: number,
  onProgress: (p: number) => void
): Promise<number[]> {
  const W = 64;
  const H = Math.max(16, Math.round((64 * video.videoHeight) / video.videoWidth));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const duration = video.duration;
  const minShot = 0.12; // ignore cuts closer than this
  const cuts: number[] = [0];
  let prev: Float32Array | null = null;

  const rvfc = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number;
  };

  if (typeof rvfc.requestVideoFrameCallback === "function") {
    // Fast path: play (sped up, muted) and inspect every painted frame.
    video.muted = true;
    video.playbackRate = 2;
    await video.play().catch(() => {});
    await new Promise<void>((resolve) => {
      const onFrame = (_now: number, meta: { mediaTime: number }) => {
        ctx.drawImage(video, 0, 0, W, H);
        const sig = signature(ctx, W, H);
        if (prev) {
          const d = meanAbsDiff(sig, prev);
          if (d > threshold && meta.mediaTime - cuts[cuts.length - 1] > minShot) {
            cuts.push(meta.mediaTime);
          }
        }
        prev = sig;
        onProgress(Math.min(0.99, meta.mediaTime / duration));
        if (video.ended || video.currentTime >= duration - 0.05) return resolve();
        rvfc.requestVideoFrameCallback!(onFrame);
      };
      rvfc.requestVideoFrameCallback!(onFrame);
      video.onended = () => resolve();
    });
    video.pause();
    video.playbackRate = 1;
  } else {
    // Fallback: seek at a fine interval.
    const step = Math.max(0.05, Math.min(0.1, duration / 400));
    for (let t = 0; t < duration; t += step) {
      await seek(video, t);
      ctx.drawImage(video, 0, 0, W, H);
      const sig = signature(ctx, W, H);
      if (prev) {
        const d = meanAbsDiff(sig, prev);
        if (d > threshold && t - cuts[cuts.length - 1] > minShot) cuts.push(t);
      }
      prev = sig;
      onProgress(Math.min(0.99, t / duration));
    }
  }

  cuts.push(duration);
  return cuts;
}

async function grabThumb(video: HTMLVideoElement, t: number, maxW = 240): Promise<string> {
  const scale = maxW / video.videoWidth;
  const w = maxW;
  const h = Math.round(video.videoHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  await seek(video, t);
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.6);
}

function pickMime(): { mime: string; ext: string } {
  const candidates = [
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9", ext: "webm" },
    { mime: "video/webm;codecs=vp8", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: "", ext: "webm" };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function loadVideoEl(src: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.src = src;
    v.onloadeddata = () => resolve(v);
    v.onerror = reject;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sw: number,
  sh: number,
  W: number,
  H: number
) {
  const scale = Math.max(W / sw, H / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReelsPage() {
  const [stage, setStage] = useState<"idle" | "detecting" | "describing" | "rendering">("idle");
  const [progress, setProgress] = useState(0);
  const [shots, setShots] = useState<Shot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState(0.18);
  const [meta, setMeta] = useState<{ duration: number; w: number; h: number } | null>(null);
  const [vibe, setVibe] = useState<{ musicVibe?: string; pacing?: string; hook?: string; caption?: string; hashtags?: string[]; editingNotes?: string[] } | null>(null);
  const [soundtrack, setSoundtrack] = useState<"none" | "original" | "upload">("none");
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const slotRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const originalSrc = useRef<string | null>(null); // for "original audio"
  const uploadedAudio = useRef<string | null>(null);

  const busy = stage !== "idle";

  // ----- 1. upload + detect cuts -----
  const onVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setShots([]);
    setVibe(null);
    const url = URL.createObjectURL(file);
    originalSrc.current = url;

    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    await new Promise<void>((res, rej) => {
      video.onloadedmetadata = () => res();
      video.onerror = () => rej();
    }).catch(() => setError("Could not read video"));
    if (!video.videoWidth) return;

    setMeta({ duration: video.duration, w: video.videoWidth, h: video.videoHeight });

    try {
      setStage("detecting");
      setProgress(0);
      const cuts = await detectCuts(video, sensitivity, setProgress);

      // Build shots + thumbnails.
      const built: Shot[] = [];
      for (let i = 0; i < cuts.length - 1; i++) {
        const start = cuts[i];
        const end = cuts[i + 1];
        if (end - start < 0.05) continue;
        const thumb = await grabThumb(video, (start + end) / 2);
        built.push({
          id: `s${i}-${Math.round(start * 1000)}`,
          start,
          end,
          duration: end - start,
          thumb,
        });
      }
      setShots(built);
      setSelected(built[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
    } finally {
      setStage("idle");
      setProgress(0);
    }
  };

  // ----- 2. AI describes each detected shot -----
  const describe = async () => {
    if (shots.length === 0 || !meta) return;
    setStage("describing");
    setError(null);
    try {
      const res = await fetch("/api/reels/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalDuration: meta.duration,
          aspectRatio: `${meta.w}:${meta.h}`,
          shots: shots.map((s, i) => ({ index: i, time: s.start, duration: s.duration, dataUrl: s.thumb })),
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setVibe(data);
      if (Array.isArray(data.shots)) {
        setShots((prev) =>
          prev.map((s, i) => {
            const d = data.shots.find((x: { index: number }) => x.index === i);
            return d ? { ...s, description: d.description, onScreenText: d.onScreenText } : s;
          })
        );
      }
    } catch {
      setError("AI description failed");
    } finally {
      setStage("idle");
    }
  };

  // ----- timeline editing -----
  const update = (id: string, patch: Partial<Shot>) =>
    setShots((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeShot = (id: string) =>
    setShots((ss) => ss.filter((s) => s.id !== id));
  const move = (id: string, dir: -1 | 1) =>
    setShots((ss) => {
      const i = ss.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ss.length) return ss;
      const next = [...ss];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const onSlotFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    const reader = new FileReader();
    reader.onload = () =>
      update(selected, {
        asset: reader.result as string,
        assetType: file.type.startsWith("video") ? "video" : "image",
      });
    reader.readAsDataURL(file);
  };

  const onAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { uploadedAudio.current = reader.result as string; setSoundtrack("upload"); };
    reader.readAsDataURL(file);
  };

  // ----- 3. render to a downloadable video -----
  const render = async () => {
    if (shots.length === 0 || !meta) return;
    setStage("rendering");
    setProgress(0);
    setError(null);
    try {
      // Output sized to the source aspect, capped to 1080 wide.
      const outW = Math.min(1080, meta.w);
      const outH = Math.round((outW * meta.h) / meta.w);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d")!;

      // Preload every shot's asset (or fall back to its original thumbnail).
      const prepared = await Promise.all(
        shots.map(async (s) => {
          let el: HTMLImageElement | HTMLVideoElement;
          let kind: "image" | "video";
          if (s.asset && s.assetType === "video") {
            el = await loadVideoEl(s.asset);
            kind = "video";
          } else if (s.asset) {
            el = await loadImage(s.asset);
            kind = "image";
          } else {
            el = await loadImage(s.thumb);
            kind = "image";
          }
          return { shot: s, el, kind };
        })
      );

      const stream = canvas.captureStream(30);

      // Optional soundtrack track.
      let audioEl: HTMLMediaElement | null = null;
      if (soundtrack === "original" && originalSrc.current) {
        const v = document.createElement("video");
        v.src = originalSrc.current;
        v.crossOrigin = "anonymous";
        await new Promise((r) => (v.onloadeddata = r));
        audioEl = v;
      } else if (soundtrack === "upload" && uploadedAudio.current) {
        const a = document.createElement("audio");
        a.src = uploadedAudio.current;
        await new Promise((r) => (a.onloadeddata = r));
        audioEl = a;
      }
      if (audioEl) {
        try {
          const capt = audioEl as HTMLMediaElement & {
            captureStream?: () => MediaStream;
            mozCaptureStream?: () => MediaStream;
          };
          const aStream = capt.captureStream?.() ?? capt.mozCaptureStream?.();
          aStream?.getAudioTracks().forEach((t) => stream.addTrack(t));
          audioEl.currentTime = 0;
          await audioEl.play().catch(() => {});
        } catch {
          /* no audio */
        }
      }

      const { mime, ext } = pickMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mime || "video/webm" }));
      });
      recorder.start();

      const total = prepared.reduce((s, p) => s + p.shot.duration, 0);
      let elapsedTotal = 0;

      for (const p of prepared) {
        if (p.kind === "video") {
          const v = p.el as HTMLVideoElement;
          v.currentTime = 0;
          await v.play().catch(() => {});
        }
        await new Promise<void>((resolve) => {
          const start = performance.now();
          const durMs = p.shot.duration * 1000;
          const tick = () => {
            const e = performance.now() - start;
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, outW, outH);
            const el = p.el;
            const sw = (el as HTMLVideoElement).videoWidth || (el as HTMLImageElement).naturalWidth || outW;
            const sh = (el as HTMLVideoElement).videoHeight || (el as HTMLImageElement).naturalHeight || outH;
            try { drawCover(ctx, el, sw, sh, outW, outH); } catch { /* frame not ready */ }
            const overlay = p.shot.text;
            if (overlay) {
              ctx.font = `bold ${Math.round(outW * 0.06)}px -apple-system, sans-serif`;
              ctx.textAlign = "center";
              ctx.lineWidth = Math.round(outW * 0.012);
              ctx.strokeStyle = "rgba(0,0,0,0.6)";
              ctx.fillStyle = "#fff";
              const y = outH * 0.85;
              ctx.strokeText(overlay, outW / 2, y);
              ctx.fillText(overlay, outW / 2, y);
            }
            setProgress(Math.min(0.99, (elapsedTotal + e) / 1000 / total));
            if (e >= durMs) {
              if (p.kind === "video") (p.el as HTMLVideoElement).pause();
              elapsedTotal += durMs;
              resolve();
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      }

      recorder.stop();
      audioEl?.pause();
      const blob = await done;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reel.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Render failed");
    } finally {
      setStage("idle");
      setProgress(0);
    }
  };

  const sel = shots.find((s) => s.id === selected) ?? null;
  const totalDur = shots.reduce((s, x) => s + x.duration, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Film className="w-5 h-5 text-[#1c1a17]" />
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Reel Remix</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">
            Detects every cut precisely → edit the timeline → drop in your clips → download a video.
          </p>
        </div>
      </div>

      {/* Upload + sensitivity */}
      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] disabled:opacity-50 text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {stage === "detecting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {stage === "detecting" ? `Detecting cuts… ${Math.round(progress * 100)}%` : "Upload reel"}
          </button>
          <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onVideo} />

          <label className="flex items-center gap-2 text-xs text-[#6b655b]">
            <Scissors className="w-3.5 h-3.5" />
            Cut sensitivity
            <input
              type="range" min={0.08} max={0.4} step={0.01}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              className="w-28"
            />
            <span className="w-8">{sensitivity.toFixed(2)}</span>
          </label>
          <span className="text-xs text-[#a39c8d]">lower = detects finer cuts</span>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {shots.length > 0 && (
          <p className="text-xs text-[#6b655b]">
            {shots.length} cuts detected · {totalDur.toFixed(1)}s total
          </p>
        )}
      </div>

      {shots.length > 0 && (
        <>
          {/* Timeline */}
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#1c1a17]">Timeline</p>
              <button
                onClick={describe}
                disabled={stage === "describing"}
                className="flex items-center gap-1.5 text-xs border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {stage === "describing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Describe shots with AI
              </button>
            </div>
            <div className="flex gap-1 overflow-x-auto pb-2">
              {shots.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "relative flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors",
                    s.id === selected ? "border-[#1c1a17]" : "border-transparent hover:border-[#c4bbab]"
                  )}
                  style={{ width: Math.max(40, s.duration * 60), height: 84 }}
                  title={`Shot ${i + 1} · ${s.duration.toFixed(2)}s`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.asset && s.assetType === "image" ? s.asset : s.thumb} alt="" className="w-full h-full object-cover" />
                  {s.asset && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center">
                    {s.duration.toFixed(1)}s
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected shot editor */}
          {sel && (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
              <div>
                <div className="rounded-lg overflow-hidden border border-[#d4ccbd]" style={{ aspectRatio: `${meta?.w}/${meta?.h}` }}>
                  {sel.asset && sel.assetType === "video" ? (
                    <video src={sel.asset} className="w-full h-full object-cover" muted controls />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={sel.asset || sel.thumb} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <input ref={slotRef} type="file" accept="image/*,video/*" className="hidden" onChange={onSlotFile} />
                <button
                  onClick={() => slotRef.current?.click()}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] py-2 rounded-lg text-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> {sel.asset ? "Replace clip" : "Drop in your clip"}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => move(sel.id, -1)} className="text-[#857f74] hover:text-[#1c1a17]"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={() => move(sel.id, 1)} className="text-[#857f74] hover:text-[#1c1a17]"><ChevronRight className="w-4 h-4" /></button>
                  <span className="text-xs text-[#857f74]">{sel.start.toFixed(2)}s → {sel.end.toFixed(2)}s</span>
                  <button onClick={() => removeShot(sel.id)} className="ml-auto text-[#a39c8d] hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>

                <label className="block text-xs text-[#6b655b]">
                  Duration: {sel.duration.toFixed(2)}s
                  <input
                    type="range" min={0.1} max={Math.max(3, sel.duration)} step={0.05}
                    value={sel.duration}
                    onChange={(e) => update(sel.id, { duration: Number(e.target.value) })}
                    className="w-full"
                  />
                </label>

                <label className="block text-xs text-[#6b655b]">
                  <span className="flex items-center gap-1"><Type className="w-3 h-3" /> On-screen text (burned into the video)</span>
                  <input
                    value={sel.text ?? ""}
                    onChange={(e) => update(sel.id, { text: e.target.value })}
                    placeholder={sel.onScreenText || "Add text…"}
                    className="mt-1 w-full bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
                  />
                </label>

                {sel.description && (
                  <p className="text-xs text-[#3c372f] bg-[#efeae1] rounded-lg p-2.5">
                    <span className="font-medium">AI:</span> {sel.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Vibe */}
          {vibe && (
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 space-y-1.5 text-sm">
              {vibe.hook && <p className="text-[#1c1a17]"><span className="font-medium">Hook:</span> {vibe.hook}</p>}
              {vibe.musicVibe && <p className="text-[#3c372f] flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> {vibe.musicVibe}</p>}
              {vibe.editingNotes && vibe.editingNotes.length > 0 && (
                <ul className="text-xs text-[#6b655b] list-disc pl-4">
                  {vibe.editingNotes.slice(0, 4).map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Soundtrack + render */}
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-4 flex flex-wrap items-center gap-3">
            <span className="text-xs text-[#6b655b] flex items-center gap-1.5"><Music className="w-3.5 h-3.5" /> Soundtrack:</span>
            {(["none", "original", "upload"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => opt === "upload" ? audioRef.current?.click() : setSoundtrack(opt)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize",
                  soundtrack === opt ? "bg-[#1c1a17] text-[#f7f3ec] border-transparent" : "border-[#c4bbab] text-[#1c1a17] hover:border-[#1c1a17]/40"
                )}
              >
                {opt === "original" ? "Original audio" : opt === "upload" ? "Upload music" : "No sound"}
              </button>
            ))}
            <input ref={audioRef} type="file" accept="audio/*,video/*" className="hidden" onChange={onAudioFile} />

            <button
              onClick={render}
              disabled={busy}
              className="ml-auto flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] disabled:opacity-50 text-[#f7f3ec] px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              {stage === "rendering" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {stage === "rendering" ? `Rendering… ${Math.round(progress * 100)}%` : "Render & download video"}
            </button>
          </div>

          <p className="text-xs text-[#857f74]">
            Rendering plays the timeline in real time to capture it, so a {totalDur.toFixed(0)}s reel
            takes about {totalDur.toFixed(0)}s. Output is MP4 in Safari, WebM in Chrome.
          </p>
        </>
      )}
    </div>
  );
}
