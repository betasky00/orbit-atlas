"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Library, Download, Copy, Trash2, Check, Clock, Plus } from "lucide-react";
import { TemplateCanvas } from "@/components/template/TemplateCanvas";
import { loadLibrary, deleteItem, updateItem, type LibraryItem } from "@/lib/libraryStore";

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = () => setItems(loadLibrary());
  useEffect(refresh, []);

  const download = async (item: LibraryItem) => {
    const res = await fetch("/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item.template, content: item.content }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name || "post"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCaption = (item: LibraryItem) => {
    const text = `${item.caption}\n\n${item.hashtags.map((h) => `#${h}`).join(" ")}`;
    navigator.clipboard.writeText(text);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const schedule = (item: LibraryItem, value: string) => {
    updateItem(item.id, { scheduledAt: value || null, status: value ? "scheduled" : "draft" });
    refresh();
  };

  const remove = (id: string) => {
    deleteItem(id);
    refresh();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Library className="w-5 h-5 text-[#1c1a17]" />
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Content Library</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">Every post you've saved — re-download, copy, or schedule.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-10 flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-full bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center mb-3">
            <Library className="w-5 h-5 text-[#857f74]" />
          </div>
          <p className="text-sm font-medium text-[#1c1a17]">Nothing saved yet</p>
          <p className="text-xs text-[#857f74] mt-1 max-w-sm">
            Generate a post in the News Studio and hit “Save to library”.
          </p>
          <Link href="/studio" className="mt-4 flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Create a post
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const w = 280;
            const scale = w / item.template.width;
            return (
              <div key={item.id} className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl overflow-hidden">
                <div className="bg-[#efeae1] flex justify-center p-3">
                  <div style={{ width: w, height: item.template.height * scale }} className="rounded-md overflow-hidden border border-[#d4ccbd]">
                    <TemplateCanvas
                      width={item.template.width}
                      height={item.template.height}
                      background={item.template.background}
                      zones={item.template.zones}
                      content={item.content}
                      scale={scale}
                    />
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs text-[#3c372f] line-clamp-2">{item.caption || item.name}</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[#857f74]" />
                    <input
                      type="datetime-local"
                      value={item.scheduledAt ? item.scheduledAt.slice(0, 16) : ""}
                      onChange={(e) => schedule(item, e.target.value)}
                      className="flex-1 bg-[#efeae1] border border-[#d4ccbd] rounded px-2 py-1 text-xs text-[#1c1a17] outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => download(item)} className="flex items-center gap-1 text-xs text-[#1c1a17] hover:text-[#000] flex-1 justify-center border border-[#c4bbab] rounded-lg py-1.5 transition-colors">
                      <Download className="w-3.5 h-3.5" /> PNG
                    </button>
                    <button onClick={() => copyCaption(item)} className="flex items-center gap-1 text-xs text-[#1c1a17] hover:text-[#000] flex-1 justify-center border border-[#c4bbab] rounded-lg py-1.5 transition-colors">
                      {copied === item.id ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      Caption
                    </button>
                    <button onClick={() => remove(item.id)} className="text-[#a39c8d] hover:text-red-600 transition-colors px-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
