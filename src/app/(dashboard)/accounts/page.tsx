"use client";

import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/ui/SocialIcons";

const PLATFORMS = [
  {
    id: "meta",
    label: "Instagram & Facebook",
    description: "Connect via Meta Business — links both Instagram and Facebook Pages",
    icons: [
      <div key="ig" className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
        <InstagramIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
      </div>,
      <div key="fb" className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
        <FacebookIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
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
      <div key="tt" className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
        <TikTokIcon className="w-5 h-5 fill-[#1c1a17]" />
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
      <div className="w-9 h-9 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center flex-shrink-0">
        <InstagramIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
      </div>
    );
  if (platform === "facebook")
    return (
      <div className="w-9 h-9 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center flex-shrink-0">
        <FacebookIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
      </div>
    );
  return (
    <div className="w-9 h-9 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center flex-shrink-0">
      <TikTokIcon className="w-5 h-5 fill-[#1c1a17]" />
    </div>
  );
}

export default function AccountsPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1c1a17]">Connected Accounts</h1>
        <p className="text-[#6b655b] text-sm mt-0.5">Manage your social media connections</p>
      </div>

      {/* Connected accounts */}
      {mockConnected.length > 0 && (
        <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl divide-y divide-[#dbd4c7]">
          {mockConnected.map((account) => (
            <div key={account.id} className="flex items-center gap-4 px-5 py-4">
              <PlatformAvatar platform={account.platform} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1c1a17]">{account.displayName}</p>
                <p className="text-xs text-[#857f74]">{account.username}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
                <button className="text-[#a39c8d] hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new connection */}
      <div>
        <h2 className="text-sm font-semibold text-[#1c1a17] mb-3">Add Account</h2>
        <div className="space-y-3">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.id}
              className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 flex items-center gap-4"
            >
              <div className="flex gap-2 flex-shrink-0">
                {platform.icons}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1c1a17]">{platform.label}</p>
                <p className="text-xs text-[#857f74] mt-0.5">{platform.description}</p>
              </div>
              <a
                href={platform.connectHref}
                className="flex items-center gap-1.5 text-sm text-[#1c1a17] bg-[#dbd4c7] hover:bg-[#d4ccbd] px-4 py-2 rounded-lg transition-colors flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Connect
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Note about API keys */}
      <div className="bg-[#e8dcb0]/40 border border-[#d8c98a] rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-4 h-4 text-[#8a7320] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#7a6a3d] space-y-1">
          <p className="font-medium text-[#6b5d2f]">Setup required</p>
          <p>
            To connect accounts, add your Meta App ID/Secret and TikTok Client Key/Secret to{" "}
            <code className="bg-[#e8dcb0]/40 px-1 rounded">.env.local</code>. See{" "}
            <span className="underline cursor-pointer">.env.example</span> for instructions.
          </p>
        </div>
      </div>
    </div>
  );
}
