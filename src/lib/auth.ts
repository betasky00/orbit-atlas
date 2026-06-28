import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { OWNER_ID } from "@/lib/owner";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Password",
      credentials: { password: { label: "Password", type: "password" } },
      // Pure password check — no DB call, so login works even before the
      // database is configured. The owner User row is created lazily on first
      // data write (see ensureOwner).
      async authorize(credentials) {
        const expected = process.env.APP_PASSWORD;
        if (!expected) return null;
        if (credentials?.password !== expected) return null;
        return { id: OWNER_ID, email: process.env.OWNER_EMAIL || "owner@orbit.local", name: "Owner" };
      },
    }),
  ],
});
