import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  secret: process.env.AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET,
  pages: {
    signIn: "/auth/v1/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      // ── Fresh login: store all token data returned from authorize ─────────
      if (user) {
        return {
          ...token,
          id: user.id,
          accessToken: user.accessToken ?? undefined,
          refreshToken: user.refreshToken ?? undefined,
          accessTokenExpiry: user.accessTokenExpiry ?? undefined,
          refreshTokenExpiry: user.refreshTokenExpiry ?? undefined,
        };
      }

      // ── Access token still valid (60 s buffer) ────────────────────────────
      const now = Math.floor(Date.now() / 1000);
      if (token.accessTokenExpiry && now < token.accessTokenExpiry - 60) {
        return token;
      }

      // ── Refresh token missing or expired — force logout ───────────────────
      if (!token.refreshToken || (token.refreshTokenExpiry && now >= token.refreshTokenExpiry)) {
        return { ...token, error: "RefreshTokenExpired" as const };
      }

      // ── Attempt silent refresh ────────────────────────────────────────────
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
        const tenantDomain = process.env.TENANT_DOMAIN ?? "admin";

        const res = await fetch(`${apiUrl}/auth/refresh`, {
          method: "GET",
          headers: {
            "X-Refresh-Token": token.refreshToken,
            "X-Tenant-Domain": tenantDomain,
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) throw new Error(`Refresh ${res.status}`);

        const data = (await res.json()) as {
          accessToken: string;
          refreshToken?: string;
          accessTokenExpiry?: number;
          refreshTokenExpiry?: number;
        };

        return {
          ...token,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? token.refreshToken,
          accessTokenExpiry: data.accessTokenExpiry,
          refreshTokenExpiry: data.refreshTokenExpiry ?? token.refreshTokenExpiry,
          error: undefined,
        };
      } catch {
        return { ...token, error: "RefreshTokenExpired" as const };
      }
    },

    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.accessToken) session.accessToken = token.accessToken;
      if (token.error) session.error = token.error;
      return session;
    },
  },
} satisfies NextAuthConfig;
