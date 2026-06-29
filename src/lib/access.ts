import { db } from "@/lib/db";

// Returns the social accounts a session may see:
//   admin  → every account in the workspace
//   member → only the accounts explicitly granted via AccountAccess
export async function accessibleAccounts(userId: string, role: string) {
  if (role === "admin") {
    return db.socialAccount.findMany({ orderBy: { createdAt: "asc" } });
  }
  return db.socialAccount.findMany({
    where: { access: { some: { userId } } },
    orderBy: { createdAt: "asc" },
  });
}

// The set of account ids a member may see (admins: all).
export async function accessibleAccountIds(userId: string, role: string): Promise<string[]> {
  const accounts = await accessibleAccounts(userId, role);
  return accounts.map((a) => a.id);
}

// Prisma `where` fragment that scopes content (templates / saved posts) so a
// member only sees workspace-shared items (socialAccountId null) plus items for
// accounts they're granted. Admins get an empty clause (everything).
export async function contentScopeWhere(userId: string, role: string) {
  if (role === "admin") return {};
  const ids = await accessibleAccountIds(userId, role);
  return { OR: [{ socialAccountId: null }, { socialAccountId: { in: ids } }] };
}

export async function canAccessAccount(userId: string, role: string, accountId: string) {
  if (role === "admin") return true;
  const row = await db.accountAccess.findUnique({
    where: { userId_socialAccountId: { userId, socialAccountId: accountId } },
  });
  return !!row;
}
