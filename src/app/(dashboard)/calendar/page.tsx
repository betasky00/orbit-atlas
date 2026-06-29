"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { loadLibrary, type LibraryItem } from "@/lib/libraryStore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function PlatformDot({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    instagram: "#E1306C",
    facebook: "#1877F2",
    tiktok: "#010101",
  };
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full"
      style={{ backgroundColor: colors[platform] ?? "#888" }}
    />
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => setItems(loadLibrary()), []);

  // Bucket scheduled library posts by day-of-month for the visible month.
  const scheduled: Record<number, { platform: string; caption: string; status: string }[]> = {};
  for (const it of items) {
    if (!it.scheduledAt) continue;
    const d = new Date(it.scheduledAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      (scheduled[day] ??= []).push({
        platform: it.platform ?? "instagram",
        caption: it.caption || it.name,
        status: it.status,
      });
    }
  }
  const mockPosts = scheduled;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Content Calendar</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">Plan and visualize your posting schedule</p>
        </div>
        <Link
          href="/studio"
          className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dbd4c7]">
          <button onClick={prev} className="text-[#6b655b] hover:text-[#1c1a17] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-[#1c1a17] font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={next} className="text-[#6b655b] hover:text-[#1c1a17] transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#dbd4c7]">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-[#857f74]">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const posts = day ? (mockPosts[day] ?? []) : [];

            return (
              <div
                key={i}
                className={cn(
                  "min-h-24 border-b border-r border-[#e3ddd0] p-2",
                  !day && "bg-[#efeae1]",
                  day && "hover:bg-[#e3ddd0] cursor-pointer transition-colors"
                )}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-xs w-5 h-5 flex items-center justify-center rounded-full",
                          isToday
                            ? "bg-[#1c1a17] text-[#f7f3ec] font-semibold"
                            : "text-[#6b655b]"
                        )}
                      >
                        {day}
                      </span>
                      {posts.length > 0 && (
                        <span className="text-xs text-[#857f74]">{posts.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {posts.slice(0, 3).map((post, j) => (
                        <div
                          key={j}
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded flex items-center gap-1 truncate",
                            post.status === "scheduled"
                              ? "bg-[#1c1a17]/20 text-[#46413a]"
                              : "bg-[#dbd4c7] text-[#6b655b]"
                          )}
                        >
                          <PlatformDot platform={post.platform} />
                          <span className="truncate">{post.caption}</span>
                        </div>
                      ))}
                      {posts.length > 3 && (
                        <p className="text-xs text-[#a39c8d] pl-1">+{posts.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[#857f74]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-[#1c1a17]/50" /> Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded bg-[#d4ccbd]" /> Draft
        </span>
        <span className="flex items-center gap-1.5">
          <PlatformDot platform="instagram" /> Instagram
        </span>
        <span className="flex items-center gap-1.5">
          <PlatformDot platform="facebook" /> Facebook
        </span>
        <span className="flex items-center gap-1.5">
          <PlatformDot platform="tiktok" /> TikTok
        </span>
      </div>
    </div>
  );
}
