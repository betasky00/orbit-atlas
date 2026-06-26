"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Sparkles,
  X,
  Clock,
  Send,
  Hash,
  MessageCircle,
  ChevronDown,
  Loader2,
  Image,
} from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/ui/SocialIcons";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: InstagramIcon, color: "#E1306C" },
  { id: "facebook", label: "Facebook", icon: FacebookIcon, color: "#1877F2" },
  { id: "tiktok", label: "TikTok", icon: TikTokIcon, color: "#010101" },
];

const TONES = ["Professional", "Casual", "Inspirational", "Humorous", "Urgent"];

export default function ComposePage() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram"]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [firstComment, setFirstComment] = useState("");
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState("Inspirational");
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showAI, setShowAI] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleAIGenerate = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "post",
          businessName: "My Business",
          niche: "luxury landscaping",
          platform: selectedPlatforms[0] ?? "instagram",
          mediaDescription: description,
          tone: tone.toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data.caption) setCaption(data.caption);
      if (data.hashtags) setHashtags(data.hashtags);
      if (data.firstComment) setFirstComment(data.firstComment);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls = files.map((f) => URL.createObjectURL(f));
    setMediaFiles((prev) => [...prev, ...urls]);
  };

  const removeMedia = (i: number) => {
    setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const fullCaption =
    caption +
    (hashtags.length > 0
      ? `\n\n${hashtags.map((h) => `#${h}`).join(" ")}`
      : "");

  const charCount = fullCaption.length;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Create Post</h1>
        <p className="text-gray-400 text-sm mt-0.5">Compose and schedule content for your accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Composer */}
        <div className="lg:col-span-2 space-y-4">
          {/* Platform selector */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-3">Post to</p>
            <div className="flex gap-2 flex-wrap">
              {PLATFORMS.map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => togglePlatform(id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all",
                    selectedPlatforms.includes(id)
                      ? "text-white border-transparent"
                      : "text-gray-400 border-[#2a2a2a] hover:border-[#3a3a3a]"
                  )}
                  style={
                    selectedPlatforms.includes(id)
                      ? { backgroundColor: color + "22", borderColor: color + "55" }
                      : {}
                  }
                >
                  <Icon
                    className="w-4 h-4"
                    style={selectedPlatforms.includes(id) ? { color } : {}}
                  />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Media upload */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-3">Media</p>
            {mediaFiles.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-violet-600/50 hover:bg-violet-600/5 transition-colors text-gray-500 hover:text-gray-300"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">Click to upload photos or videos</span>
                <span className="text-xs text-gray-600">PNG, JPG, MP4 · Max 100MB</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {mediaFiles.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 border-2 border-dashed border-[#2a2a2a] rounded-lg flex items-center justify-center hover:border-violet-600/50 transition-colors"
                  >
                    <Image className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Caption */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 font-medium">Caption</p>
              <span className={cn("text-xs", charCount > 2000 ? "text-red-400" : "text-gray-500")}>
                {charCount} / 2200
              </span>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption…"
              rows={5}
              className="w-full bg-transparent text-sm text-white placeholder-gray-600 resize-none outline-none leading-relaxed"
            />
          </div>

          {/* Hashtags */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-xs text-gray-400 font-medium">Hashtags</p>
              <span className="text-xs text-gray-600">({hashtags.length}/30)</span>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300"
                  >
                    #{tag}
                    <button onClick={() => setHashtags((h) => h.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              placeholder="Add hashtag and press Enter…"
              className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value.trim().replace(/^#/, "");
                  if (val && !hashtags.includes(val)) {
                    setHashtags((h) => [...h, val]);
                  }
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          </div>

          {/* First comment */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-xs text-gray-400 font-medium">First Comment</p>
              <span className="text-xs text-gray-600">Boosts engagement</span>
            </div>
            <textarea
              value={firstComment}
              onChange={(e) => setFirstComment(e.target.value)}
              placeholder="Add a first comment to boost reach…"
              rows={2}
              className="w-full bg-transparent text-sm text-white placeholder-gray-600 resize-none outline-none"
            />
          </div>

          {/* Schedule */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-xs text-gray-400 font-medium">Publish</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setScheduleMode("now")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm border transition-all",
                  scheduleMode === "now"
                    ? "bg-violet-600/20 border-violet-600/40 text-violet-300"
                    : "border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                )}
              >
                Post now
              </button>
              <button
                onClick={() => setScheduleMode("schedule")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm border transition-all",
                  scheduleMode === "schedule"
                    ? "bg-violet-600/20 border-violet-600/40 text-violet-300"
                    : "border-[#2a2a2a] text-gray-400 hover:border-[#3a3a3a]"
                )}
              >
                Schedule
              </button>
            </div>
            {scheduleMode === "schedule" && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-3 w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-600/50"
              />
            )}
          </div>

          {/* Submit */}
          <button
            disabled={posting || selectedPlatforms.length === 0}
            onClick={async () => {
              setPosting(true);
              try {
                await fetch("/api/posts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    businessId: "demo",
                    caption,
                    hashtags,
                    firstComment,
                    mediaUrls: [],
                    mediaType: "image",
                    publishNow: scheduleMode === "now",
                    scheduledAt: scheduleMode === "schedule" ? scheduledAt : null,
                    aiGenerated: false,
                  }),
                });
                setCaption("");
                setHashtags([]);
                setFirstComment("");
                setMediaFiles([]);
              } finally {
                setPosting(false);
              }
            }}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {posting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {posting
              ? "Publishing…"
              : scheduleMode === "now"
              ? "Post Now"
              : "Schedule Post"}
          </button>
        </div>

        {/* Right — AI Panel */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">AI Assistant</span>
              </div>
              <button onClick={() => setShowAI(!showAI)}>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-gray-500 transition-transform",
                    showAI && "rotate-180"
                  )}
                />
              </button>
            </div>

            {showAI && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">
                    Describe your post
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. A before/after photo of a luxury garden installation in Paris with water feature"
                    rows={3}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 resize-none outline-none focus:border-violet-600/50"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 block mb-1.5">Tone</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={cn(
                          "text-xs px-2.5 py-1 rounded-full border transition-all",
                          tone === t
                            ? "bg-violet-600/20 border-violet-600/40 text-violet-300"
                            : "border-[#2a2a2a] text-gray-500 hover:border-[#3a3a3a]"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleAIGenerate}
                  disabled={aiLoading}
                  className="w-full bg-violet-600/20 hover:bg-violet-600/30 border border-violet-600/30 text-violet-300 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {aiLoading ? "Generating…" : "Generate Caption & Hashtags"}
                </button>
              </div>
            )}
          </div>

          {/* Best times panel */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-medium text-white">Best times today</span>
            </div>
            <div className="space-y-2">
              {[
                { time: "12:00 PM", score: "High", color: "text-emerald-400" },
                { time: "6:00 PM", score: "Peak", color: "text-violet-400" },
                { time: "8:00 PM", score: "Good", color: "text-blue-400" },
              ].map(({ time, score, color }) => (
                <button
                  key={time}
                  onClick={() => {
                    setScheduleMode("schedule");
                    const today = new Date().toISOString().split("T")[0];
                    const [h, rest] = time.split(":");
                    const [min, period] = rest.split(" ");
                    let hour = parseInt(h);
                    if (period === "PM" && hour !== 12) hour += 12;
                    setScheduledAt(`${today}T${hour.toString().padStart(2, "0")}:${min}`);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#0d0d0d] hover:bg-[#161616] rounded-lg transition-colors text-left"
                >
                  <span className="text-sm text-white">{time}</span>
                  <span className={cn("text-xs font-medium", color)}>{score}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-3">Preview</p>
            <div className="bg-[#0d0d0d] rounded-lg p-3 text-xs text-gray-300 leading-relaxed min-h-16 whitespace-pre-wrap">
              {fullCaption || (
                <span className="text-gray-600">Caption preview will appear here…</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
