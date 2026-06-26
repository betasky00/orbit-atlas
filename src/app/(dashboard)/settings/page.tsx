"use client";

import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

export default function SettingsPage() {
  const [businesses, setBusinesses] = useState([
    { id: "1", name: "Luxe Gardens Paris", niche: "luxury landscaping", color: "#6366f1" },
  ]);
  const [newBiz, setNewBiz] = useState({ name: "", niche: "", color: "#6366f1" });
  const [adding, setAdding] = useState(false);

  const addBusiness = async () => {
    if (!newBiz.name) return;
    const res = await fetch("/api/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBiz),
    });
    const data = await res.json();
    setBusinesses((b) => [...b, data]);
    setNewBiz({ name: "", niche: "", color: "#6366f1" });
    setAdding(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your businesses and preferences</p>
      </div>

      {/* Businesses */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-sm font-semibold text-white">Businesses</h2>
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add business
          </button>
        </div>

        <div className="divide-y divide-[#1f1f1f]">
          {businesses.map((biz) => (
            <div key={biz.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ backgroundColor: biz.color }} />
              <div className="flex-1">
                <p className="text-sm text-white">{biz.name}</p>
                <p className="text-xs text-gray-500">{biz.niche}</p>
              </div>
              <button className="text-gray-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {adding && (
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newBiz.name}
                  onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })}
                  placeholder="Business name"
                  className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-600/50"
                />
                <input
                  value={newBiz.niche}
                  onChange={(e) => setNewBiz({ ...newBiz, niche: e.target.value })}
                  placeholder="Niche (e.g. fashion)"
                  className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-600/50"
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Color</p>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewBiz({ ...newBiz, color: c })}
                      className="w-6 h-6 rounded-md transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        outline: newBiz.color === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addBusiness}
                  className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API keys info */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white">API Configuration</h2>
        <div className="space-y-3 text-xs text-gray-400">
          <div className="flex items-start gap-3 bg-[#0d0d0d] rounded-lg p-3">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">OpenAI API Key</p>
              <p className="mt-0.5">Set <code className="text-violet-300">OPENAI_API_KEY</code> in .env.local — powers all AI caption, bio, and timing features.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#0d0d0d] rounded-lg p-3">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Meta App (Instagram & Facebook)</p>
              <p className="mt-0.5">Set <code className="text-violet-300">META_APP_ID</code> and <code className="text-violet-300">META_APP_SECRET</code>. Create at developers.facebook.com — requires instagram_content_publish permission.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#0d0d0d] rounded-lg p-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">TikTok Developer App</p>
              <p className="mt-0.5">Set <code className="text-violet-300">TIKTOK_CLIENT_KEY</code> and <code className="text-violet-300">TIKTOK_CLIENT_SECRET</code>. Create at developers.tiktok.com — requires video.publish scope.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
