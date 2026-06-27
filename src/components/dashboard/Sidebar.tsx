"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  PlusSquare,
  CalendarDays,
  Settings,
  Users,
  BarChart2,
  Sparkles,
  ChevronDown,
  Plus,
  Newspaper,
  LayoutTemplate,
  Film,
} from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/ui/SocialIcons";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
  color: string;
  socialAccounts: { platform: string }[];
}

interface SidebarProps {
  businesses: Business[];
  currentBusinessId?: string;
}

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/studio", label: "News Studio", icon: Newspaper },
  { href: "/reels", label: "Reel Remix", icon: Film },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/compose", label: "Create Post", icon: PlusSquare },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/accounts", label: "Accounts", icon: Users },
  { href: "/ai", label: "AI Tools", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === "instagram")
    return <InstagramIcon className="w-3 h-3" style={{ color: "#E1306C" }} />;
  if (platform === "facebook")
    return <FacebookIcon className="w-3 h-3" style={{ color: "#1877F2" }} />;
  return <TikTokIcon className="w-3 h-3 fill-[#1c1a17]" />;
}

export function Sidebar({ businesses, currentBusinessId }: SidebarProps) {
  const pathname = usePathname();
  const [businessOpen, setBusinessOpen] = useState(true);

  const currentBusiness = businesses.find((b) => b.id === currentBusinessId) ?? businesses[0];

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen bg-[#efeae1] border-r border-[#dbd4c7] sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#dbd4c7]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#1c1a17] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#f7f3ec]" />
          </div>
          <span className="font-semibold text-[#1c1a17] text-[15px] tracking-tight">Orbit</span>
        </div>
      </div>

      {/* Business Switcher */}
      <div className="px-3 py-3 border-b border-[#dbd4c7]">
        <button
          onClick={() => setBusinessOpen(!businessOpen)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#e3ddd0] transition-colors text-left"
        >
          {currentBusiness && (
            <div
              className="w-5 h-5 rounded-md flex-shrink-0"
              style={{ backgroundColor: currentBusiness.color }}
            />
          )}
          <span className="text-sm text-[#1c1a17] flex-1 truncate font-medium">
            {currentBusiness?.name ?? "Select Business"}
          </span>
          <ChevronDown
            className={cn("w-3.5 h-3.5 text-[#857f74] transition-transform", businessOpen && "rotate-180")}
          />
        </button>

        {businessOpen && (
          <div className="mt-1 space-y-0.5">
            {businesses.map((b) => (
              <Link
                key={b.id}
                href={`/dashboard?business=${b.id}`}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors",
                  b.id === currentBusiness?.id
                    ? "bg-[#dbd4c7] text-[#1c1a17]"
                    : "text-[#6b655b] hover:text-[#1c1a17] hover:bg-[#e3ddd0]"
                )}
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: b.color }}
                />
                <span className="flex-1 truncate">{b.name}</span>
                <div className="flex gap-0.5">
                  {b.socialAccounts.slice(0, 3).map((a, i) => (
                    <PlatformIcon key={i} platform={a.platform} />
                  ))}
                </div>
              </Link>
            ))}
            <Link
              href="/settings/businesses/new"
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-[#857f74] hover:text-[#1c1a17] hover:bg-[#e3ddd0] transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add business
            </Link>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-[#1c1a17]/20 text-[#1c1a17] font-medium"
                : "text-[#6b655b] hover:text-[#1c1a17] hover:bg-[#e3ddd0]"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[#dbd4c7]">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#e3ddd0] cursor-pointer transition-colors">
          <div className="w-6 h-6 rounded-full bg-[#1c1a17] flex items-center justify-center text-xs text-[#f7f3ec] font-medium">
            O
          </div>
          <span className="text-xs text-[#6b655b] flex-1">My Account</span>
        </div>
      </div>
    </aside>
  );
}
