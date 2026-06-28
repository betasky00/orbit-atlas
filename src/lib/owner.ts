import { db } from "@/lib/db";

// Single-owner workspace. The whole app belongs to one user; we use a stable id
// so login never needs a DB round-trip, and lazily create the User row the first
// time real data (a business / connected account) is saved.
export const OWNER_ID = "owner";

export async function ensureOwner() {
  await db.user.upsert({
    where: { id: OWNER_ID },
    update: {},
    create: {
      id: OWNER_ID,
      email: process.env.OWNER_EMAIL || "owner@orbit.local",
      name: "Owner",
    },
  });
}
