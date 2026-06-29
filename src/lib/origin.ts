import type { NextRequest } from "next/server";

// The exact origin the user is actually on (e.g. https://dashboards-alpha-beige.vercel.app).
// Used to build OAuth redirect URIs so the dialog request and the token exchange
// are byte-for-byte identical — Meta rejects the code otherwise.
export function originFrom(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
}
