"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/ui/SocialIcons";

interface Account {
  id: string;
  platform: string;
  username: string;
  displayName?: string | null;
}
interface Business {
  id: string;
  socialAccounts: Account[];
}

const CONNECTORS = [
  {
    id: "meta",
    label: "Instagram & Facebook",
    description: "Connect via Meta — links both your Instagram Business account and Facebook Page",
    connectHref: "/api/auth/meta",
    icons: [
      <div key="ig" className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
        <InstagramIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
      </div>,
      <div key="fb" className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
        <FacebookIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
      </div>,
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Connect your TikTok account to publish videos",
    connectHref: "/api/auth/tiktok",
    icons: [
      <div key="tt" className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
        <TikTokIcon className="w-5 h-5 fill-[#1c1a17]" />
      </div>,
    ],
  },
];

function PlatformAvatar({ platform }: { platform: string }) {
  const glyph =
    platform === "instagram" ? (
      <InstagramIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
    ) : platform === "facebook" ? (
      <FacebookIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
    ) : (
      <TikTokIcon className="w-5 h-5 fill-[#1c1a17]" />
    );
  return (
    <div className="w-9 h-9 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center flex-shrink-0">
      {glyph}
    </div>
  );
}

export default function AccountsPage() {
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () => {
    fetch("/api/businesses")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBusinesses(Array.isArray(d) ? d : []))
      .catch(() => setBusinesses([]));
  };

  useEffect(() => {
    load();
    // surface ?success / ?error from OAuth callbacks
    const p = new URLSearchParams(window.location.search);
    if (p.get("success")) setNotice("Account connected ✓");
    if (p.get("error")) setNotice(`Connection failed: ${p.get("error")}`);
  }, []);

  const accounts = businesses?.flatMap((b) => b.socialAccounts ?? []) ?? [];
  const loading = businesses === null;

  const disconnect = async (id: string) => {
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1c1a17]">Connected Accounts</h1>
        <p className="text-[#6b655b] text-sm mt-0.5">Manage your social media connections</p>
      </div>

      {notice && (
        <div className="bg-[#efeae1] border border-[#dbd4c7] rounded-lg px-4 py-2.5 text-sm text-[#1c1a17]">
          {notice}
        </div>
      )}

      {/* Connected list */}
      {loading ? (
        <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-6 text-sm text-[#857f74]">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading…
        </div>
      ) : accounts.length > 0 ? (
        <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl divide-y divide-[#dbd4c7]">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-4">
              <PlatformAvatar platform={a.platform} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1c1a17] truncate">{a.displayName || a.username}</p>
                <p className="text-xs text-[#857f74] capitalize">{a.platform} · @{a.username}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
              <button
                onClick={() => disconnect(a.id)}
                className="text-[#a39c8d] hover:text-red-600 transition-colors"
                title="Disconnect"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Connectors */}
      <div>
        <h2 className="text-sm font-semibold text-[#1c1a17] mb-3">
          {accounts.length > 0 ? "Add another account" : "Connect an account"}
        </h2>
        <div className="space-y-3">
          {CONNECTORS.map((c) => (
            <div key={c.id} className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 flex items-center gap-4">
              <div className="flex gap-2 flex-shrink-0">{c.icons}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1c1a17]">{c.label}</p>
                <p className="text-xs text-[#857f74] mt-0.5">{c.description}</p>
              </div>
              <a
                href={c.connectHref}
                className="flex items-center gap-1.5 text-sm text-[#f7f3ec] bg-[#1c1a17] hover:bg-[#000000] px-4 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Connect
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Setup note */}
      <div className="bg-[#efeae1] border border-[#dbd4c7] rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-4 h-4 text-[#857f74] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#6b655b] space-y-1">
          <p className="font-medium text-[#1c1a17]">Before connecting works</p>
          <p>
            You need a database connected (DATABASE_URL) and your Meta / TikTok app credentials
            set in your environment variables. Instagram must be a Business or Creator account
            linked to a Facebook Page.
          </p>
        </div>
      </div>
    </div>
  );
}
