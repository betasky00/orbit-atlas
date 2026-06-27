import { Sidebar } from "@/components/dashboard/Sidebar";
import { db } from "@/lib/db";

// For demo purposes without full auth, we use a mock user
// Replace with: const session = await auth(); and use session.user.id
async function getBusinesses() {
  // Demo: return empty for now, real data comes after auth setup
  return [];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const businesses = await getBusinesses();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar businesses={businesses} />
      <main className="flex-1 overflow-y-auto bg-[#e7e1d6]">{children}</main>
    </div>
  );
}
