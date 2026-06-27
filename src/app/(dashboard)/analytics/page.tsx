import { TrendingUp, Users, Eye, Heart } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "@/components/ui/SocialIcons";

const mockData = {
  instagram: {
    followers: 12400,
    followerGrowth: "+240 this week",
    reach: 45200,
    impressions: 89400,
    engagement: "4.2%",
    topPosts: [
      { caption: "Transform your outdoor space 🌿", likes: 342, comments: 28, reach: 8900 },
      { caption: "Behind the scenes: Versailles project", likes: 289, comments: 41, reach: 7200 },
      { caption: "Spring collection reveal", likes: 256, comments: 19, reach: 6100 },
    ],
  },
  facebook: {
    followers: 8200,
    followerGrowth: "+89 this week",
    reach: 22100,
    impressions: 41000,
    engagement: "2.8%",
    topPosts: [
      { caption: "Spring garden designs 2025", likes: 156, comments: 22, reach: 4200 },
      { caption: "Client showcase: Neuilly-sur-Seine", likes: 132, comments: 18, reach: 3800 },
    ],
  },
};

const stats = [
  { label: "Total Followers", value: "20.6K", change: "+329", icon: Users, color: "text-[#1c1a17]" },
  { label: "Total Reach", value: "67.3K", change: "+12%", icon: Eye, color: "text-[#1c1a17]" },
  { label: "Avg. Engagement", value: "3.5%", change: "+0.4%", icon: Heart, color: "text-[#1c1a17]" },
  { label: "Posts This Month", value: "18", change: "+3", icon: TrendingUp, color: "text-emerald-700" },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1c1a17]">Analytics</h1>
        <p className="text-[#6b655b] text-sm mt-0.5">Performance overview across all accounts</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#857f74]">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-semibold text-[#1c1a17]">{value}</p>
            <p className="text-xs text-emerald-700 mt-1">{change} vs last week</p>
          </div>
        ))}
      </div>

      {/* Per-platform breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(mockData).map(([platform, data]) => (
          <div key={platform} className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              {platform === "instagram" ? (
                <div className="w-7 h-7 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
                  <InstagramIcon className="w-3.5 h-3.5" style={{ color: "#1c1a17" }} />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-md bg-[#efeae1] border border-[#dbd4c7] flex items-center justify-center">
                  <FacebookIcon className="w-3.5 h-3.5" style={{ color: "#1c1a17" }} />
                </div>
              )}
              <span className="text-sm font-semibold text-[#1c1a17] capitalize">{platform}</span>
              <span className="text-xs text-emerald-700 ml-auto">{data.followerGrowth}</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#efeae1] rounded-lg p-3">
                <p className="text-xs text-[#857f74]">Followers</p>
                <p className="text-base font-semibold text-[#1c1a17] mt-0.5">
                  {data.followers.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#efeae1] rounded-lg p-3">
                <p className="text-xs text-[#857f74]">Reach</p>
                <p className="text-base font-semibold text-[#1c1a17] mt-0.5">
                  {(data.reach / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="bg-[#efeae1] rounded-lg p-3">
                <p className="text-xs text-[#857f74]">Engagement</p>
                <p className="text-base font-semibold text-[#1c1a17] mt-0.5">{data.engagement}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-[#857f74] mb-2">Top Posts</p>
              <div className="space-y-2">
                {data.topPosts.map((post, i) => (
                  <div key={i} className="flex items-center gap-3 bg-[#efeae1] rounded-lg px-3 py-2.5">
                    <p className="text-xs text-[#3c372f] flex-1 truncate">{post.caption}</p>
                    <div className="flex items-center gap-3 text-xs text-[#857f74] flex-shrink-0">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />{post.likes}
                      </span>
                      <span>{(post.reach / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#f4f1ea] border border-[#dbd4c7] rounded-xl p-5 text-center text-sm text-[#857f74]">
        Full analytics charts coming soon — connect your accounts to see live data
      </div>
    </div>
  );
}
