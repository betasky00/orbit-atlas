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
        <h1 className="text-2xl font-semibold text-[#1c1a17]">Settings</h1>
        <p className="text-[#6b655b] text-sm mt-0.5">Manage your businesses and preferences</p>
      </div>

      {/* Businesses */}
      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dbd4c7]">
          <h2 className="text-sm font-semibold text-[#1c1a17]">Businesses</h2>
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 text-xs text-[#1c1a17] hover:text-[#46413a] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add business
          </button>
        </div>

        <div className="divide-y divide-[#dbd4c7]">
          {businesses.map((biz) => (
            <div key={biz.id} className="flex items-center gap-3 px-5 py-3.5">
              <div className="w-6 h-6 rounded-md flex-shrink-0" style={{ backgroundColor: biz.color }} />
              <div className="flex-1">
                <p className="text-sm text-[#1c1a17]">{biz.name}</p>
                <p className="text-xs text-[#857f74]">{biz.niche}</p>
              </div>
              <button className="text-[#a39c8d] hover:text-red-600 transition-colors">
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
                  className="bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
                />
                <input
                  value={newBiz.niche}
                  onChange={(e) => setNewBiz({ ...newBiz, niche: e.target.value })}
                  placeholder="Niche (e.g. fashion)"
                  className="bg-[#efeae1] border border-[#d4ccbd] rounded-lg px-3 py-2 text-sm text-[#1c1a17] placeholder-[#a39c8d] outline-none focus:border-[#1c1a17]/50"
                />
              </div>
              <div>
                <p className="text-xs text-[#6b655b] mb-2">Color</p>
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
                  className="flex items-center gap-1.5 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="text-[#6b655b] hover:text-[#1c1a17] px-3 py-1.5 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API keys info */}
      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#1c1a17]">API Configuration</h2>
        <div className="space-y-3 text-xs text-[#6b655b]">
          <div className="flex items-start gap-3 bg-[#efeae1] rounded-lg p-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1c1a17] mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-[#1c1a17] font-medium">OpenAI API Key</p>
              <p className="mt-0.5">Set <code className="text-[#46413a]">OPENAI_API_KEY</code> in .env.local — powers all AI caption, bio, and timing features.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#efeae1] rounded-lg p-3">
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-[#1c1a17] font-medium">Meta App (Instagram & Facebook)</p>
              <p className="mt-0.5">Set <code className="text-[#46413a]">META_APP_ID</code> and <code className="text-[#46413a]">META_APP_SECRET</code>. Create at developers.facebook.com — requires instagram_content_publish permission.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#efeae1] rounded-lg p-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#857f74] mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-[#1c1a17] font-medium">TikTok Developer App</p>
              <p className="mt-0.5">Set <code className="text-[#46413a]">TIKTOK_CLIENT_KEY</code> and <code className="text-[#46413a]">TIKTOK_CLIENT_SECRET</code>. Create at developers.tiktok.com — requires video.publish scope.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
