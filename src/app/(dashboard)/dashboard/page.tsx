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
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400">
        <InstagramIcon className="w-3 h-3" />
        Instagram
      </span>
    );
  }
  if (platform === "facebook") {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
        <FacebookIcon className="w-3 h-3" />
        Facebook
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400">
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
          <h1 className="text-2xl font-semibold text-white">Good morning 👋</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Thursday, June 26 · 3 posts scheduled this week
          </p>
        </div>
        <Link
          href="/compose"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
            className="bg-[#111] border border-[#1f1f1f] rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {stat.platform === "instagram" ? (
                  <div className="w-8 h-8 rounded-lg ig-gradient flex items-center justify-center">
                    <InstagramIcon className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color }}>
                    <FacebookIcon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">{stat.account}</p>
                  <p className="text-xs text-gray-500 capitalize">{stat.platform}</p>
                </div>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stat.change}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0d0d0d] rounded-lg p-3">
                <p className="text-xs text-gray-500">Followers</p>
                <p className="text-lg font-semibold text-white mt-0.5">{stat.followers}</p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-3">
                <p className="text-xs text-gray-500">Published</p>
                <p className="text-lg font-semibold text-white mt-0.5">{stat.posts}</p>
              </div>
              <div className="bg-[#0d0d0d] rounded-lg p-3">
                <p className="text-xs text-gray-500">Scheduled</p>
                <p className="text-lg font-semibold text-violet-400 mt-0.5">{stat.scheduled}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming posts */}
      <div className="bg-[#111] border border-[#1f1f1f] rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            Upcoming Posts
          </h2>
          <Link href="/calendar" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
            View calendar <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-[#1f1f1f]">
          {mockUpcoming.map((post) => (
            <div key={post.id} className="flex items-center gap-4 px-5 py-3.5">
              <PlatformBadge platform={post.platform} />
              <p className="text-sm text-gray-300 flex-1 truncate">{post.caption}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-500">{post.scheduledAt}</span>
                {post.status === "scheduled" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI suggestion banner */}
      <div className="bg-violet-600/10 border border-violet-600/20 rounded-xl p-5 flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Best time to post today</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Based on your audience, post at <span className="text-violet-400 font-medium">6:00 PM – 8:00 PM</span> for maximum reach
          </p>
        </div>
        <Link
          href="/compose"
          className="text-xs text-violet-400 bg-violet-600/20 hover:bg-violet-600/30 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
        >
          Create now
        </Link>
      </div>
    </div>
  );
}
