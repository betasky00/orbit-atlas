"use client";

import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/ui/SocialIcons";

const PLATFORMS = [
  {
    id: "meta",
    label: "Instagram & Facebook",
    description: "Connect via Meta Business — links both Instagram and Facebook Pages",
    icons: [
      <div key="ig" className="w-8 h-8 rounded-lg ig-gradient flex items-center justify-center">
        <InstagramIcon className="w-4 h-4 text-white" />
      </div>,
      <div key="fb" className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center">
        <FacebookIcon className="w-4 h-4 text-white" />
      </div>,
    ],
    connectHref: "/api/auth/meta",
    color: "#E1306C",
  },
  {
    id: "tiktok",
    label: "TikTok",
    description: "Connect your TikTok creator account to publish videos",
    icons: [
      <div key="tt" className="w-8 h-8 rounded-lg bg-black border border-[#2a2a2a] flex items-center justify-center">
        <TikTokIcon className="w-5 h-5 fill-white" />
      </div>,
    ],
    connectHref: "/api/auth/tiktok",
    color: "#010101",
  },
];

const mockConnected = [
  {
    id: "1",
    platform: "instagram",
    username: "@luxegardens",
    displayName: "Luxe Gardens Paris",
    avatar: null,
    status: "active",
  },
  {
    id: "2",
    platform: "facebook",
    username: "Luxe Gardens Paris",
    displayName: "Luxe Gardens Paris",
    avatar: null,
    status: "active",
  },
];

function PlatformAvatar({ platform }: { platform: string }) {
  if (platform === "instagram")
    return (
      <div className="w-9 h-9 rounded-lg ig-gradient flex items-center justify-center flex-shrink-0">
        <InstagramIcon className="w-4 h-4 text-white" />
      </div>
    );
  if (platform === "facebook")
    return (
      <div className="w-9 h-9 rounded-lg bg-[#1877F2] flex items-center justify-center flex-shrink-0">
        <FacebookIcon className="w-4 h-4 text-white" />
      </div>
    );
  return (
    <div className="w-9 h-9 rounded-lg bg-black border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
      <TikTokIcon className="w-5 h-5 fill-white" />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Connected Accounts</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your social media connections</p>
      </div>

      {/* Connected accounts */}
      {mockConnected.length > 0 && (
        <div className="bg-[#111] border border-[#1f1f1f] rounded-xl divide-y divide-[#1f1f1f]">
          {mockConnected.map((account) => (
            <div key={account.id} className="flex items-center gap-4 px-5 py-4">
              <PlatformAvatar platform={account.platform} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{account.displayName}</p>
                <p className="text-xs text-gray-500">{account.username}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
                <button className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new connection */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Add Account</h2>
        <div className="space-y-3">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 flex items-center gap-4"
            >
              <div className="flex gap-2 flex-shrink-0">
                {platform.icons}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{platform.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{platform.description}</p>
              </div>
              <a
                href={platform.connectHref}
                className="flex items-center gap-1.5 text-sm text-white bg-[#1f1f1f] hover:bg-[#2a2a2a] px-4 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Connect
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Note about API keys */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-300/80 space-y-1">
          <p className="font-medium text-amber-300">Setup required</p>
          <p>
            To connect accounts, add your Meta App ID/Secret and TikTok Client Key/Secret to{" "}
            <code className="bg-amber-500/10 px-1 rounded">.env.local</code>. See{" "}
            <span className="underline cursor-pointer">.env.example</span> for instructions.
          </p>
        </div>
      </div>
    </div>
  );
}
