import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Protect the whole app behind login, except: NextAuth routes, the cron
// endpoint (secured separately by CRON_SECRET), static assets, and /login.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|login).*)"],
};
