"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, Plus } from "lucide-react";

interface Account { id: string; platform: string; username: string }
interface Business { id: string; socialAccounts: Account[] }

export default function AnalyticsPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBusinesses(Array.isArray(d) ? d : []))
      .catch(() => setBusinesses([]));
  }, []);

  const accounts = businesses?.flatMap((b) => b.socialAccounts ?? []) ?? [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1c1a17]">Analytics</h1>
        <p className="text-[#6b655b] text-sm mt-0.5">Performance across your connected accounts</p>
      </div>

      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-10 flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-full bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center mb-3">
          <BarChart2 className="w-5 h-5 text-[#857f74]" />
        </div>
        {accounts.length === 0 ? (
          <>
            <p className="text-sm font-medium text-[#1c1a17]">No data yet</p>
            <p className="text-xs text-[#857f74] mt-1 max-w-sm">
              Connect an account to start pulling real follower counts, reach and engagement
              from the Instagram, Facebook and TikTok APIs.
            </p>
            <Link
              href="/accounts"
              className="mt-4 flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Connect an account
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-[#1c1a17]">
              {accounts.length} account{accounts.length > 1 ? "s" : ""} connected
            </p>
            <p className="text-xs text-[#857f74] mt-1 max-w-sm">
              Live analytics for your connected accounts is the next piece being wired up —
              real reach, impressions and engagement pulled from each platform.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
