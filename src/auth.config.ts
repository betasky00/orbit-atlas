import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no DB, no Node APIs) so it can run inside middleware.
// The Credentials provider with its DB-touching logic lives in src/lib/auth.ts.
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) token.uid = (user as { id: string }).id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
