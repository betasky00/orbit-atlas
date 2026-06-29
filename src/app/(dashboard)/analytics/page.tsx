"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, Plus, Users, Eye, Image as ImageIcon, RefreshCw, Loader2 } from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/ui/SocialIcons";

interface Stat {
  id: string;
  platform: string;
  username: string;
  displayName?: string | null;
  followers: number | null;
  mediaCount: number | null;
  reach?: number | null;
  error?: string;
}

function Glyph({ platform }: { platform: string }) {
  if (platform === "instagram") return <InstagramIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />;
  if (platform === "facebook") return <FacebookIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />;
  return <TikTokIcon className="w-4 h-4 fill-[#1c1a17]" />;
}

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/analytics")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setStats(Array.isArray(d) ? d : []))
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const totalFollowers = (stats ?? []).reduce((s, a) => s + (a.followers ?? 0), 0);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Analytics</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">Live numbers from your connected accounts</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 border border-[#c4bbab] hover:border-[#1c1a17]/40 text-[#1c1a17] px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && stats === null ? (
        <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-6 text-sm text-[#857f74]">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading live stats…
        </div>
      ) : (stats ?? []).length === 0 ? (
        <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-10 flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-full bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center mb-3">
            <BarChart2 className="w-5 h-5 text-[#857f74]" />
          </div>
          <p className="text-sm font-medium text-[#1c1a17]">No connected accounts</p>
          <p className="text-xs text-[#857f74] mt-1 max-w-sm">
            Connect Instagram or Facebook to see live follower counts and reach.
          </p>
          <Link
            href="/accounts"
            className="mt-4 flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Connect an account
          </Link>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5">
              <div className="flex items-center gap-1.5 text-[#857f74] mb-1">
                <Users className="w-3.5 h-3.5" />
                <span className="text-xs">Total followers</span>
              </div>
              <p className="text-2xl font-semibold text-[#1c1a17]">{fmt(totalFollowers)}</p>
            </div>
            <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5">
              <div className="flex items-center gap-1.5 text-[#857f74] mb-1">
                <Users className="w-3.5 h-3.5" />
                <span className="text-xs">Accounts</span>
              </div>
              <p className="text-2xl font-semibold text-[#1c1a17]">{(stats ?? []).length}</p>
            </div>
          </div>

          {/* Per account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(stats ?? []).map((a) => (
              <div key={a.id} className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
                    <Glyph platform={a.platform} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#1c1a17] truncate">{a.displayName || a.username}</p>
                    <p className="text-xs text-[#857f74]">@{a.username}</p>
                  </div>
                </div>

                {a.error ? (
                  <p className="text-xs text-red-600">{a.error}</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#efeae1] rounded-lg p-3">
                      <p className="text-xs text-[#857f74] flex items-center gap-1"><Users className="w-3 h-3" />Followers</p>
                      <p className="text-base font-semibold text-[#1c1a17] mt-0.5">{fmt(a.followers)}</p>
                    </div>
                    <div className="bg-[#efeae1] rounded-lg p-3">
                      <p className="text-xs text-[#857f74] flex items-center gap-1"><ImageIcon className="w-3 h-3" />Posts</p>
                      <p className="text-base font-semibold text-[#1c1a17] mt-0.5">{fmt(a.mediaCount)}</p>
                    </div>
                    <div className="bg-[#efeae1] rounded-lg p-3">
                      <p className="text-xs text-[#857f74] flex items-center gap-1"><Eye className="w-3 h-3" />Reach 28d</p>
                      <p className="text-base font-semibold text-[#1c1a17] mt-0.5">{fmt(a.reach)}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
