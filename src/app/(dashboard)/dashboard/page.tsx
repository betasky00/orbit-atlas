"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Newspaper, Film, LayoutTemplate, Plus, Users, ArrowUpRight } from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/ui/SocialIcons";

interface Account {
  id: string;
  platform: string;
  username: string;
  displayName?: string | null;
}
interface Business {
  id: string;
  name: string;
  socialAccounts: Account[];
}

function PlatformGlyph({ platform }: { platform: string }) {
  if (platform === "instagram") return <InstagramIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />;
  if (platform === "facebook") return <FacebookIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />;
  return <TikTokIcon className="w-4 h-4 fill-[#1c1a17]" />;
}

const QUICK = [
  { href: "/studio", label: "News Studio", desc: "Turn a news item into a finished post", icon: Newspaper },
  { href: "/reels", label: "Reel Remix", desc: "Recreate a reel's edit with your footage", icon: Film },
  { href: "/templates", label: "Templates", desc: "Build reusable post templates", icon: LayoutTemplate },
];

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);

  useEffect(() => {
    fetch("/api/businesses")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBusinesses(Array.isArray(d) ? d : []))
      .catch(() => setBusinesses([]));
  }, []);

  const accounts = businesses?.flatMap((b) => b.socialAccounts ?? []) ?? [];
  const loading = businesses === null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Overview</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">Your workspace at a glance</p>
        </div>
        <Link
          href="/studio"
          className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create
        </Link>
      </div>

      {/* Quick actions — these work today */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK.map(({ href, label, desc, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 hover:border-[#1c1a17]/30 transition-colors group"
          >
            <div className="w-9 h-9 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-[#1c1a17]" />
            </div>
            <p className="text-sm font-medium text-[#1c1a17] flex items-center gap-1">
              {label}
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="text-xs text-[#857f74] mt-0.5">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Connected accounts */}
      <div>
        <h2 className="text-sm font-semibold text-[#1c1a17] mb-3">Connected accounts</h2>

        {loading ? (
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-6 text-sm text-[#857f74]">
            Loading…
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-10 flex flex-col items-center text-center">
            <div className="w-11 h-11 rounded-full bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-[#857f74]" />
            </div>
            <p className="text-sm font-medium text-[#1c1a17]">No accounts connected yet</p>
            <p className="text-xs text-[#857f74] mt-1 max-w-sm">
              Connect Instagram, Facebook or TikTok to manage and publish. Your real follower
              counts and metrics will appear here once connected.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
                  <PlatformGlyph platform={a.platform} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1c1a17] truncate">
                    {a.displayName || a.username}
                  </p>
                  <p className="text-xs text-[#857f74] capitalize">
                    {a.platform} · @{a.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
