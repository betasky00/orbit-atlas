import {
  TrendingUp,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";
import Link from "next/link";

const mockStats = [
  { platform: "instagram", account: "@luxegardens", followers: "12.4K", change: "+240", posts: 3, scheduled: 5, color: "#E1306C" },
  { platform: "facebook", account: "Luxe Gardens Paris", followers: "8.2K", change: "+89", posts: 1, scheduled: 2, color: "#1877F2" },
];

const mockUpcoming = [
  {
    id: "1",
    platform: "instagram",
    caption: "Transform your outdoor space into a sanctuary 🌿",
    scheduledAt: "Today, 6:00 PM",
    status: "scheduled",
  },
  {
    id: "2",
    platform: "facebook",
    caption: "Spring collection — new garden designs available",
    scheduledAt: "Tomorrow, 9:00 AM",
    status: "scheduled",
  },
  {
    id: "3",
    platform: "instagram",
    caption: "Before & after: Versailles-inspired terrace",
    scheduledAt: "Jun 28, 12:00 PM",
    status: "draft",
  },
];

function PlatformBadge({ platform }: { platform: string }) {
  if (platform === "instagram") {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#1c1a17]/[0.06] text-[#1c1a17]">
        <InstagramIcon className="w-3 h-3" />
        Instagram
      </span>
    );
  }
  if (platform === "facebook") {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#1c1a17]/[0.06] text-[#1c1a17]">
        <FacebookIcon className="w-3 h-3" />
        Facebook
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#1c1a17]/[0.06] text-[#6b655b]">
      TikTok
    </span>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1c1a17]">Good morning 👋</h1>
          <p className="text-[#6b655b] text-sm mt-0.5">
            Thursday, June 26 · 3 posts scheduled this week
          </p>
        </div>
        <Link
          href="/compose"
          className="flex items-center gap-2 bg-[#1c1a17] hover:bg-[#000000] text-[#f7f3ec] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Create Post
        </Link>
      </div>

      {/* Account cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockStats.map((stat) => (
          <div
            key={stat.account}
            className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stat.platform === "instagram" ? (
                  <div className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
                    <InstagramIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
                    <FacebookIcon className="w-4 h-4" style={{ color: "#1c1a17" }} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#1c1a17]">{stat.account}</p>
                  <p className="text-xs text-[#857f74] capitalize">{stat.platform}</p>
                </div>
              </div>
              <span className="text-xs text-emerald-700 bg-emerald-700/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#efeae1] rounded-lg p-3">
                <p className="text-xs text-[#857f74]">Followers</p>
                <p className="text-lg font-semibold text-[#1c1a17] mt-0.5">{stat.followers}</p>
              </div>
              <div className="bg-[#efeae1] rounded-lg p-3">
                <p className="text-xs text-[#857f74]">Published</p>
                <p className="text-lg font-semibold text-[#1c1a17] mt-0.5">{stat.posts}</p>
              </div>
              <div className="bg-[#efeae1] rounded-lg p-3">
                <p className="text-xs text-[#857f74]">Scheduled</p>
                <p className="text-lg font-semibold text-[#1c1a17] mt-0.5">{stat.scheduled}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming posts */}
      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#dbd4c7]">
          <h2 className="text-sm font-semibold text-[#1c1a17] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#1c1a17]" />
            Upcoming Posts
          </h2>
          <Link href="/calendar" className="text-xs text-[#1c1a17] hover:text-[#46413a] flex items-center gap-1">
            View calendar <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-[#dbd4c7]">
          {mockUpcoming.map((post) => (
            <div key={post.id} className="flex items-center gap-4 px-5 py-3.5">
              <PlatformBadge platform={post.platform} />
              <p className="text-sm text-[#3c372f] flex-1 truncate">{post.caption}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-[#857f74]">{post.scheduledAt}</span>
                {post.status === "scheduled" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                ) : (
                  <FileText className="w-4 h-4 text-[#857f74]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI suggestion banner */}
      <div className="bg-[#1c1a17]/10 border border-[#1c1a17]/20 rounded-xl p-5 flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-[#1c1a17]/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-[#1c1a17]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1c1a17]">Best time to post today</p>
          <p className="text-xs text-[#6b655b] mt-0.5">
            Based on your audience, post at <span className="text-[#1c1a17] font-medium">6:00 PM – 8:00 PM</span> for maximum reach
          </p>
        </div>
        <Link
          href="/compose"
          className="text-xs text-[#1c1a17] bg-[#1c1a17]/20 hover:bg-[#1c1a17]/30 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          Create now
        </Link>
      </div>
    </div>
  );
}
